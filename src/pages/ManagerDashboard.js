import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import Sidebar from '../components/common/Sidebar';
import StatsGrid from '../components/overview/StatsGrid';
import StatsCard from '../components/common/StatsCard';
import RecentAllocations from '../components/overview/RecentAllocations';
import RoomList from '../components/rooms/RoomList';
import RoomForm from '../components/rooms/RoomForm';
import PaymentList from '../components/payments/PaymentList';
import GuestList from '../components/guests/GuestList';
import BudgetList from '../components/budget/BudgetList';
import BudgetForm from '../components/budget/BudgetForm';
import BudgetRequestList from '../components/budget/BudgetRequestList';
import BudgetReviewModal from '../components/budget/BudgetReviewModal';
import UpcomingCheckouts from '../components/common/UpcomingCheckouts';
import ConfirmModal from '../components/common/ConfirmModal';
import Toast from '../components/common/Toast';
import './theme.css';

// ── Overview Component (with maintenance alerts + sparkline) ──
function Overview({ rooms, allocations, payments, requests, setActive }) {
  const revenue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pending = requests.filter(r => r.status === 'PENDING').length;

  // Rooms in maintenance
  const maintenanceRooms = rooms.filter(r => r.status?.toUpperCase() === 'MAINTENANCE');
  console.log('Room statuses:', rooms.map(r => ({ id: r.id, status: r.status })));

  // Last 7 days revenue trend (sparkline)
  const last7DaysRevenue = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayRevenue = payments
        .filter(p => (p.created_at || p.date).split('T')[0] === dayStr)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      result.push(dayRevenue);
    }
    return result;
  };
  const revenueTrend = last7DaysRevenue();

  // Stats for the grid (excluding revenue, which is shown separately)
  const stats = [
    { icon: 'rooms', value: rooms.length, label: 'Total Rooms', variant: 'default', format: false },
    { icon: 'occupied', value: rooms.filter(r => r.status === 'OCCUPIED').length, label: 'Occupied', variant: 'default', format: false },
    { icon: 'pending', value: pending, label: 'Pending Requests', variant: 'gold', format: false },
  ];

  return (
    <div>
      {/* Revenue card with sparkline */}
      <div className="stats-grid">
        <StatsCard
          icon="revenue"
          value={revenue}
          label="Total Revenue"
          variant="green"
          format={true}
          trend={revenueTrend}
        />
      </div>

      <StatsGrid stats={stats} />

      {/* Maintenance Alerts Widget */}
      {maintenanceRooms.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #e76f51' }}>
          <div className="card-header">
            <span className="card-title">🔧 Maintenance Alerts</span>
            <span className="badge badge-red">{maintenanceRooms.length} rooms</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRooms.map(room => (
                  <tr key={room.id}>
                    <td><strong>Room {room.number}</strong></td>
                    <td>{room.room_class}</td>
                    <td><span className="badge badge-red">MAINTENANCE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming checkouts */}
      <UpcomingCheckouts allocations={allocations} rooms={rooms} />

      {pending > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          You have <strong>{pending}</strong> budget request{pending > 1 ? 's' : ''} awaiting review.
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: '1rem' }} onClick={() => setActive('requests')}>
            Review Now
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Allocations</span>
        </div>
        <RecentAllocations allocations={allocations} limit={6} />
      </div>
    </div>
  );
}

// ── Manage Rooms (with ConfirmModal + Toast) ──
function ManageRooms({ rooms, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const handleCreate = async (formData) => {
    await api.post('/rooms/', { ...formData, capacity: parseInt(formData.capacity) });
    onSuccess();
    setToast({ type: 'success', message: 'Room created successfully' });
  };

  const handleUpdate = async (formData) => {
    await api.put(`/rooms/${editingRoom.id}/`, { ...formData, capacity: parseInt(formData.capacity) });
    onSuccess();
    setToast({ type: 'success', message: 'Room updated successfully' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/rooms/${deleteTarget.id}/`);
      onSuccess();
      setToast({ type: 'success', message: `Room ${deleteTarget.room_no} deleted successfully` });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      let message = 'Failed to delete room.';
      if (status === 409) {
        message = 'Cannot delete room with active allocations. Check out all guests first.';
      } else if (status === 404) {
        message = 'Room not found. It may have been already deleted.';
      } else if (status === 400) {
        message = data?.detail || data?.error || 'Invalid request.';
      } else if (status === 500) {
        message = 'Server error. Please try again later.';
      } else {
        message = data?.detail || data?.error || 'Delete failed.';
      }
      setToast({ type: 'error', message });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const confirmDelete = (room) => setDeleteTarget(room);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add Room
        </button>
      </div>

      <RoomForm
        isOpen={showForm}
        onClose={closeForm}
        onSubmit={editingRoom ? handleUpdate : handleCreate}
        editing={!!editingRoom}
        initialData={editingRoom}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Are you sure you want to delete room ${deleteTarget?.room_no || deleteTarget?.id || 'this room'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        size="small"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Rooms</span>
          <span className="badge badge-blue">{rooms.length} rooms</span>
        </div>
        <RoomList
          rooms={rooms}
          loading={loading}
          showActions={true}
          onEdit={openEdit}
          onDelete={confirmDelete}
        />
      </div>
    </div>
  );
}

// ── Budget Requests Review ──
function BudgetRequestsReview({ requests, onSuccess, loading }) {
  const [reviewing, setReviewing] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleReview = async (id, status, comment) => {
    await api.post(`/budget-requests/${id}/submit_review/`, { status, comment });
    onSuccess();
  };

  const openReview = (request) => {
    setReviewing(request);
    setShowModal(true);
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const reviewed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div>
      <BudgetReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        budget={reviewing}
        onReview={handleReview}
        isRequest={true}
      />

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Pending Review</span>
            <span className="badge badge-gold">{pending.length} pending</span>
          </div>
          <BudgetRequestList
            requests={pending}
            loading={loading}
            showReviewButton={true}
            onReview={openReview}
          />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Review History</span>
        </div>
        <BudgetRequestList
          requests={reviewed}
          loading={loading}
          showReviewButton={false}
        />
      </div>
    </div>
  );
}

// ── Monthly Budgets ──
function MonthlyBudgets({ budgets, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  const handleCreate = async (data) => {
    await api.post('/budgets/', data);
    onSuccess();
  };

  const handleSubmitForApproval = async (id) => {
    setSubmittingId(id);
    try {
      await api.post(`/budgets/${id}/submit_for_approval/`);
      onSuccess();
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Create Budget
        </button>
      </div>

      <BudgetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      <div className="card">
        <div className="card-header">
          <span className="card-title">Monthly Budgets</span>
        </div>
        <BudgetList
          budgets={budgets}
          loading={loading}
          showSubmitButton={true}
          onSubmit={handleSubmitForApproval}
          submittingId={submittingId}
        />
      </div>
    </div>
  );
}

// ── All Guests View ──
function AllGuestsView({ allocations, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">All Allocations</span>
        <span className="badge badge-blue">{allocations.length} total</span>
      </div>
      <GuestList allocations={allocations} loading={loading} showCheckout={false} />
    </div>
  );
}

// ── Payments View ──
function PaymentsView({ payments, loading }) {
  return (
    <div>
      <PaymentList payments={payments} loading={loading} showTotal={true} />
    </div>
  );
}

// ── Main ManagerDashboard ──
export default function ManagerDashboard({ user, onLogout }) {
  const [active, setActive] = useState('overview');
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const titles = {
    overview: 'Overview',
    rooms: 'Manage Rooms',
    guests: 'All Guests',
    payments: 'Payments',
    requests: 'Budget Requests',
    budgets: 'Monthly Budgets',
  };

  const navItems = [
    { id: 'overview', icon: 'overview', label: 'Overview' },
    { id: 'rooms', icon: 'rooms', label: 'Manage Rooms' },
    { id: 'guests', icon: 'guests', label: 'All Guests' },
    { id: 'payments', icon: 'payments', label: 'Payments' },
    { id: 'requests', icon: 'requests', label: 'Budget Requests' },
    { id: 'budgets', icon: 'budgets', label: 'Monthly Budgets' },
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const fetchRooms = api.get('/rooms/').then(res => setRooms(res.data.results || res.data)).catch(() => setErrors(prev => ({...prev, rooms: true})));
    const fetchAllocations = api.get('/room-allocations/').then(res => setAllocations(res.data.results || res.data)).catch(() => setErrors(prev => ({...prev, allocations: true})));
    const fetchPayments = api.get('/payments/').then(res => setPayments(res.data.results || res.data)).catch(() => setErrors(prev => ({...prev, payments: true})));
    const fetchRequests = api.get('/budget-requests/').then(res => setRequests(res.data.results || res.data)).catch(() => setErrors(prev => ({...prev, requests: true})));
    const fetchBudgets = api.get('/budgets/').then(res => setBudgets(res.data.results || res.data)).catch(() => setErrors(prev => ({...prev, budgets: true})));

    await Promise.allSettled([fetchRooms, fetchAllocations, fetchPayments, fetchRequests, fetchBudgets]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="dashboard">
      <Sidebar
        active={active}
        setActive={setActive}
        fullName={user.fullName}
        role="Manager"
        onLogout={onLogout}
        navItems={navItems}
      />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{titles[active]}</span>
          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="page-body">
          {Object.keys(errors).length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
              ⚠️ Some data could not be loaded due to permission issues. Contact your administrator.
            </div>
          )}
          {active === 'overview' && <Overview rooms={rooms} allocations={allocations} payments={payments} requests={requests} setActive={setActive} />}
          {active === 'rooms' && <ManageRooms rooms={rooms} onSuccess={fetchAll} loading={loading} />}
          {active === 'guests' && <AllGuestsView allocations={allocations} loading={loading} />}
          {active === 'payments' && <PaymentsView payments={payments} loading={loading} />}
          {active === 'requests' && <BudgetRequestsReview requests={requests} onSuccess={fetchAll} loading={loading} />}
          {active === 'budgets' && <MonthlyBudgets budgets={budgets} onSuccess={fetchAll} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
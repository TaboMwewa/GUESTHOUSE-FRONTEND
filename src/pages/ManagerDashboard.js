import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import Sidebar from '../components/common/Sidebar';
import StatsGrid from '../components/overview/StatsGrid';
import RecentAllocations from '../components/overview/RecentAllocations';
import RoomList from '../components/rooms/RoomList';
import RoomForm from '../components/rooms/RoomForm';
import PaymentList from '../components/payments/PaymentList';
import GuestList from '../components/guests/GuestList';
import BudgetList from '../components/budget/BudgetList';
import BudgetForm from '../components/budget/BudgetForm';
import BudgetRequestList from '../components/budget/BudgetRequestList';
import BudgetReviewModal from '../components/budget/BudgetReviewModal';
import './theme.css';

// ── Overview Component (uses StatsGrid + RecentAllocations) ──
function Overview({ rooms, allocations, payments, requests, setActive }) {
  const revenue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pending = requests.filter(r => r.status === 'PENDING').length;

  const stats = [
    { icon: 'rooms', value: rooms.length, label: 'Total Rooms', variant: 'default' },
    { icon: 'occupied', value: rooms.filter(r => r.status === 'OCCUPIED').length, label: 'Occupied', variant: 'default' },
    { icon: 'revenue', value: revenue, label: 'Total Revenue', variant: 'green' },
    { icon: 'pending', value: pending, label: 'Pending Requests', variant: 'gold' },
  ];

  return (
    <div>
      <StatsGrid stats={stats} />

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

// ── Manage Rooms (uses RoomList + RoomForm) ──
function ManageRooms({ rooms, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const handleCreate = async (formData) => {
    await api.post('/rooms/', { ...formData, capacity: parseInt(formData.capacity) });
    onSuccess();
  };

  const handleUpdate = async (formData) => {
    await api.put(`/rooms/${editingRoom.id}/`, { ...formData, capacity: parseInt(formData.capacity) });
    onSuccess();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    await api.delete(`/rooms/${id}/`);
    onSuccess();
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

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
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

// ── Budget Requests Review (uses BudgetRequestList + BudgetReviewModal) ──
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

// ── Monthly Budgets (uses BudgetList + BudgetForm) ──
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

// ── All Guests View (uses GuestList) ──
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

// ── Payments View (uses PaymentList) ──
function PaymentsView({ payments, loading }) {
  return (
    <div>
      <PaymentList payments={payments} loading={loading} showTotal={true} />
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function ManagerDashboard({ user, onLogout }) {
  const [active, setActive] = useState('overview');
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const [r, a, p, b, bu] = await Promise.all([
        api.get('/rooms/'),
        api.get('/room-allocations/'),
        api.get('/payments/'),
        api.get('/budget-requests/'),
        api.get('/budgets/'),
      ]);
      setRooms(r.data.results || r.data);
      setAllocations(a.data.results || a.data);
      setPayments(p.data.results || p.data);
      setRequests(b.data.results || b.data);
      setBudgets(bu.data.results || bu.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="page-body">
          {active === 'overview' && (
            <Overview
              rooms={rooms}
              allocations={allocations}
              payments={payments}
              requests={requests}
              setActive={setActive}
            />
          )}
          {active === 'rooms' && (
            <ManageRooms rooms={rooms} onSuccess={fetchAll} loading={loading} />
          )}
          {active === 'guests' && (
            <AllGuestsView allocations={allocations} loading={loading} />
          )}
          {active === 'payments' && (
            <PaymentsView payments={payments} loading={loading} />
          )}
          {active === 'requests' && (
            <BudgetRequestsReview
              requests={requests}
              onSuccess={fetchAll}
              loading={loading}
            />
          )}
          {active === 'budgets' && (
            <MonthlyBudgets
              budgets={budgets}
              onSuccess={fetchAll}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
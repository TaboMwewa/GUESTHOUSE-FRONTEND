import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import Sidebar from '../components/common/Sidebar';
import StatsGrid from '../components/overview/StatsGrid';
import RecentAllocations from '../components/overview/RecentAllocations';
import RoomList from '../components/rooms/RoomList';
import PaymentList from '../components/payments/PaymentList';
import GuestList from '../components/guests/GuestList';
import CheckInForm from '../components/checkin/CheckInForm';
import BudgetRequestList from '../components/budget/BudgetRequestList';
import BudgetRequestForm from '../components/budget/BudgetRequestForm';
import './theme.css';

// ── Overview Component ────────────────────────────────────
function Overview({ rooms, allocations, payments, setActive }) {
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const activeGuests = allocations.filter(a => !a.checked_out_at).length;

  const today = payments.filter(p => {
    const d = new Date(p.created_at || p.date || '');
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const todayRevenue = today.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const stats = [
    { icon: 'available', value: available, label: 'Available Rooms', variant: 'default' },
    { icon: 'occupied', value: occupied, label: 'Occupied Rooms', variant: 'default' },
    { icon: 'active-guests', value: activeGuests, label: 'Active Guests', variant: 'green' },
    { icon: 'revenue', value: todayRevenue, label: "Today's Revenue", variant: 'gold' },
  ];

  return (
    <div>
      <StatsGrid stats={stats} />

      <div className="card">
        <div className="card-header">
          <span className="card-title">Current Guests</span>
          <button className="btn btn-primary btn-sm" onClick={() => setActive('checkin')}>
            Check In
          </button>
        </div>
        <RecentAllocations
          allocations={allocations}
          limit={5}
          showCheckoutButton={false}
        />
      </div>
    </div>
  );
}

// ── Rooms View (read-only) ───────────────────────────────
function RoomsView({ rooms, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">All Rooms</span>
      </div>
      <RoomList rooms={rooms} loading={loading} showActions={false} />
    </div>
  );
}

// ── Current Guests with Checkout ─────────────────────────
function GuestsView({ allocations, onSuccess, loading }) {
  const [checkingOutId, setCheckingOutId] = useState(null);

  const handleCheckout = async (id) => {
    setCheckingOutId(id);
    try {
      await api.post(`/api/room-allocations/${id}/check_out/`);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Checkout failed.');
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Current Guests</span>
        <span className="badge badge-blue">
          {allocations.filter(a => !a.checked_out_at).length} active
        </span>
      </div>
      <GuestList
        allocations={allocations}
        loading={loading}
        showCheckout={true}
        onCheckout={handleCheckout}
        checkingOutId={checkingOutId}
      />
    </div>
  );
}

// ── Payments View ─────────────────────────────────────────
function PaymentsView({ payments, loading }) {
  return (
    <div>
      <PaymentList payments={payments} loading={loading} showTotal={true} />
    </div>
  );
}

// ── Budget Requests View ─────────────────────────────────
function BudgetRequestsView({ requests, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (formData) => {
    await api.post('/budget-requests/', formData);
    onSuccess();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          New Request
        </button>
      </div>

      <BudgetRequestForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      <div className="card">
        <div className="card-header">
          <span className="card-title">My Budget Requests</span>
        </div>
        <BudgetRequestList
          requests={requests}
          loading={loading}
          showReviewButton={false}
        />
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function ReceptionistDashboard({ user, onLogout }) {
  const [active, setActive] = useState('overview');
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const titles = {
    overview: 'Overview',
    rooms: 'Rooms',
    checkin: 'Check In Guest',
    guests: 'Current Guests',
    payments: 'Payments',
    budgets: 'Budget Requests',
  };

  const navItems = [
    { id: 'overview', icon: 'overview', label: 'Overview' },
    { id: 'rooms', icon: 'rooms', label: 'Rooms' },
    { id: 'checkin', icon: 'checkin', label: 'Check In' },
    { id: 'guests', icon: 'guests', label: 'Current Guests' },
    { id: 'payments', icon: 'payments', label: 'Payments' },
    { id: 'budgets', icon: 'requests', label: 'Budget Requests' },
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, p, b] = await Promise.all([
        api.get('/rooms/'),
        api.get('/room-allocations/'),
        api.get('/payments/'),
        api.get('/budget-requests/'),
      ]);
      setRooms(r.data.results || r.data);
      setAllocations(a.data.results || a.data);
      setPayments(p.data.results || p.data);
      setRequests(b.data.results || b.data);
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
        role="Receptionist"
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
              setActive={setActive}
            />
          )}
          {active === 'rooms' && <RoomsView rooms={rooms} loading={loading} />}
          {active === 'checkin' && <CheckInForm rooms={rooms} onSuccess={fetchAll} />}
          {active === 'guests' && (
            <GuestsView allocations={allocations} onSuccess={fetchAll} loading={loading} />
          )}
          {active === 'payments' && <PaymentsView payments={payments} loading={loading} />}
          {active === 'budgets' && (
            <BudgetRequestsView requests={requests} onSuccess={fetchAll} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}
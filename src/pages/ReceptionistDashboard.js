import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import './theme.css';

// ── Helpers ──────────────────────────────────────────────
const fmt = (amt) => `K ${parseFloat(amt || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function statusBadge(s) {
  const map = { AVAILABLE: 'badge-green', OCCUPIED: 'badge-red', MAINTENANCE: 'badge-gold' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

function reqBadge(s) {
  const map = { PENDING: 'badge-gold', APPROVED: 'badge-green', REJECTED: 'badge-red' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

// ── Sidebar ───────────────────────────────────────────────
function Sidebar({ active, setActive, fullName, onLogout }) {
  const navItems = [
    { id: 'overview',  icon: '🏠', label: 'Overview' },
    { id: 'rooms',     icon: '🛏️', label: 'Rooms' },
    { id: 'checkin',   icon: '✅', label: 'Check In' },
    { id: 'guests',    icon: '👥', label: 'Current Guests' },
    { id: 'payments',  icon: '💳', label: 'Payments' },
    { id: 'budgets',   icon: '📋', label: 'Budget Requests' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GH</div>
        <div className="sidebar-title">GuestHouse</div>
        <div className="sidebar-role">Receptionist</div>
      </div>
      <div className="sidebar-user">
        <strong>{fullName}</strong>
        Staff Portal
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Overview ──────────────────────────────────────────────
function Overview({ rooms, allocations, payments, setActive }) {
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied  = rooms.filter(r => r.status === 'OCCUPIED').length;
  const today     = payments.filter(p => {
    const d = new Date(p.created_at || p.date || '');
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const todayRevenue = today.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛏️</div>
          <div className="stat-value">{available}</div>
          <div className="stat-label">Available Rooms</div>
        </div>
        <div className="stat-card" style={{'--accent':'var(--brick-red)'}}>
          <div className="stat-icon">🔑</div>
          <div className="stat-value">{occupied}</div>
          <div className="stat-label">Occupied Rooms</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{allocations.filter(a => !a.checked_out_at).length}</div>
          <div className="stat-label">Active Guests</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{fmt(todayRevenue)}</div>
          <div className="stat-label">Today's Revenue</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Current Guests</span>
          <button className="btn btn-primary btn-sm" onClick={() => setActive('checkin')}>+ Check In</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Guest</th><th>Contact</th><th>Room</th><th>Checked In</th><th>Status</th>
            </tr></thead>
            <tbody>
              {allocations.filter(a => !a.checked_out_at).slice(0, 5).map(a => (
                <tr key={a.id}>
                  <td><strong>{a.guest_name}</strong></td>
                  <td>{a.guest_contact}</td>
                  <td>Room {a.room}</td>
                  <td>{fmtDate(a.checked_in_at)}</td>
                  <td><span className="badge badge-green">Checked In</span></td>
                </tr>
              ))}
              {allocations.filter(a => !a.checked_out_at).length === 0 && (
                <tr><td colSpan={5} style={{textAlign:'center', color:'var(--text-muted)', padding:'2rem'}}>No active guests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Rooms View ────────────────────────────────────────────
function RoomsView({ rooms, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">All Rooms</span>
      </div>
      {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Room No.</th><th>Class</th><th>Capacity</th><th>Price / Night</th><th>Status</th>
            </tr></thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.room_no}</strong></td>
                  <td>{r.room_class}</td>
                  <td>{r.capacity} guest{r.capacity > 1 ? 's' : ''}</td>
                  <td>{fmt(r.price_per_night)}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Check In Form ─────────────────────────────────────────
function CheckInForm({ rooms, onSuccess }) {
  const available = rooms.filter(r => r.status === 'AVAILABLE');
  const [form, setForm] = useState({
    guest_name: '', guest_contact: '', room: '',
    checked_in_at: new Date().toISOString().slice(0, 16),
    no_of_occupants: 1,
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const selectedRoom = rooms.find(r => r.id === parseInt(form.room));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post('/api/room-allocations/', {
        ...form,
        room: parseInt(form.room),
        no_of_occupants: parseInt(form.no_of_occupants),
        checked_in_at: new Date(form.checked_in_at).toISOString(),
      });
      if (paymentAmount) {
        await api.post('/api/payments/', {
          allocation: res.data.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
        });
      }
      setSuccess(`${form.guest_name} successfully checked in to Room ${selectedRoom?.room_no}!`);
      setForm({ guest_name:'', guest_contact:'', room:'', checked_in_at: new Date().toISOString().slice(0,16), no_of_occupants:1 });
      setPaymentAmount('');
      onSuccess();
    } catch (err) {
      const detail = err.response?.data;
      setError(typeof detail === 'object' ? JSON.stringify(detail) : 'Check-in failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{maxWidth: 680}}>
      <div className="card-header"><span className="card-title">Guest Check-In</span></div>
      <div className="card-body">
        {error   && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{marginBottom:'1.5rem'}}>
            <div className="form-group">
              <label>Guest Full Name</label>
              <input value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} placeholder="e.g. Peter Zulu" required />
            </div>
            <div className="form-group">
              <label>Contact / Phone</label>
              <input value={form.guest_contact} onChange={e => setForm({...form, guest_contact: e.target.value})} placeholder="+260 977 123 456" required />
            </div>
            <div className="form-group">
              <label>Room</label>
              <select value={form.room} onChange={e => setForm({...form, room: e.target.value})} required>
                <option value="">— Select a room —</option>
                {available.map(r => (
                  <option key={r.id} value={r.id}>Room {r.room_no} — {r.room_class} ({fmt(r.price_per_night)}/night)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>No. of Occupants</label>
              <input type="number" min="1" max={selectedRoom?.capacity || 10}
                value={form.no_of_occupants}
                onChange={e => setForm({...form, no_of_occupants: e.target.value})}
                required />
              {selectedRoom && <small style={{color:'var(--text-muted)', fontSize:'0.72rem'}}>Max capacity: {selectedRoom.capacity}</small>}
            </div>
            <div className="form-group span-2">
              <label>Check-In Date & Time</label>
              <input type="datetime-local" value={form.checked_in_at} onChange={e => setForm({...form, checked_in_at: e.target.value})} required />
            </div>
          </div>

          <div style={{borderTop:'1px solid var(--border)', paddingTop:'1.25rem', marginBottom:'1.5rem'}}>
            <p style={{fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'1rem'}}>Payment (optional)</p>
            <div className="form-grid">
              <div className="form-group">
                <label>Amount (K)</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE">Mobile Money</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner"/>Checking in…</> : '✅ Check In Guest'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Current Guests (with checkout) ───────────────────────
function GuestsView({ allocations, onSuccess, loading }) {
  const [checkingOut, setCheckingOut] = useState(null);
  const active = allocations.filter(a => !a.checked_out_at);

  const handleCheckout = async (id) => {
    setCheckingOut(id);
    try {
      await api.post(`/api/room-allocations/${id}/check_out/`);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Checkout failed.');
    } finally { setCheckingOut(null); }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Current Guests</span>
        <span className="badge badge-blue">{active.length} active</span>
      </div>
      {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Guest</th><th>Contact</th><th>Room</th><th>Occupants</th><th>Checked In</th><th>Action</th>
            </tr></thead>
            <tbody>
              {active.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.guest_name}</strong></td>
                  <td>{a.guest_contact}</td>
                  <td>Room {a.room}</td>
                  <td>{a.no_of_occupants}</td>
                  <td>{fmtDate(a.checked_in_at)}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCheckout(a.id)}
                      disabled={checkingOut === a.id}
                    >
                      {checkingOut === a.id ? 'Checking out…' : '🚪 Check Out'}
                    </button>
                  </td>
                </tr>
              ))}
              {active.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🏨</div><p>No active guests</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Payments View ─────────────────────────────────────────
function PaymentsView({ payments, loading }) {
  const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  return (
    <div>
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(2, 1fr)', maxWidth:500, marginBottom:'1.5rem'}}>
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{fmt(total)}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Transactions</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Payment History</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Allocation ID</th><th>Amount</th><th>Method</th>
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>Booking #{p.allocation}</td>
                    <td><strong>{fmt(p.amount)}</strong></td>
                    <td><span className="badge badge-blue">{p.payment_method}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={3}><div className="empty-state"><div className="empty-icon">💳</div><p>No payments recorded</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Budget Requests ───────────────────────────────────────
function BudgetRequestsView({ requests, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ amount: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await api.post('/api/budget-requests/', { amount: form.amount, purpose: form.purpose });
      setForm({ amount: '', purpose: '' });
      setShowForm(false);
      onSuccess();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? JSON.stringify(d) : 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Budget Request</span>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Amount (K)</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" required />
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Describe what the funds are needed for…" required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner"/>Submitting…</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">My Budget Requests</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Date</th><th>Amount</th><th>Purpose</th><th>Status</th>
              </tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td><strong>{fmt(r.amount)}</strong></td>
                    <td>{r.purpose}</td>
                    <td>{reqBadge(r.status)}</td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon">📋</div><p>No requests submitted yet</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function ReceptionistDashboard({ user, onLogout }) {
  const [active, setActive]           = useState('overview');
  const [rooms, setRooms]             = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [payments, setPayments]       = useState([]);
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);

  const titles = {
    overview: 'Overview', rooms: 'Rooms', checkin: 'Check In Guest',
    guests: 'Current Guests', payments: 'Payments', budgets: 'Budget Requests',
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, p, b] = await Promise.all([
        api.get('/api/rooms/', { timeout: 60000 }),
        api.get('/api/room-allocations/', { timeout: 60000 }),
        api.get('/api/payments/', { timeout: 60000 }),
        api.get('/api/budget-requests/', { timeout: 60000 }),
      ]);
      setRooms(r.data.results || r.data);
      setAllocations(a.data.results || a.data);
      setPayments(p.data.results || p.data);
      setRequests(b.data.results || b.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="dashboard">
      <Sidebar active={active} setActive={setActive} fullName={user.fullName} onLogout={onLogout} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{titles[active]}</span>
          <div className="topbar-right">
            <span className="topbar-date">{new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span>
          </div>
        </div>
        <div className="page-body">
          {active === 'overview' && <Overview rooms={rooms} allocations={allocations} payments={payments} setActive={setActive} />}
          {active === 'rooms'    && <RoomsView rooms={rooms} loading={loading} />}
          {active === 'checkin'  && <CheckInForm rooms={rooms} onSuccess={fetchAll} />}
          {active === 'guests'   && <GuestsView allocations={allocations} onSuccess={fetchAll} loading={loading} />}
          {active === 'payments' && <PaymentsView payments={payments} loading={loading} />}
          {active === 'budgets'  && <BudgetRequestsView requests={requests} onSuccess={fetchAll} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
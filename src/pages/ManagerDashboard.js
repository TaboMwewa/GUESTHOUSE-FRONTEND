import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import './theme.css';

const fmt = (amt) => `K ${parseFloat(amt || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function statusBadge(s) {
  const map = { AVAILABLE: 'badge-green', OCCUPIED: 'badge-red', MAINTENANCE: 'badge-gold' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}
function reqBadge(s) {
  const map = { PENDING: 'badge-gold', APPROVED: 'badge-green', REJECTED: 'badge-red', DRAFT: 'badge-gray', SUBMITTED: 'badge-blue' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

// ── Sidebar ───────────────────────────────────────────────
function Sidebar({ active, setActive, fullName, onLogout }) {
  const navItems = [
    { id: 'overview',  icon: '🏠', label: 'Overview' },
    { id: 'rooms',     icon: '🛏️', label: 'Manage Rooms' },
    { id: 'guests',    icon: '👥', label: 'All Guests' },
    { id: 'payments',  icon: '💳', label: 'Payments' },
    { id: 'requests',  icon: '📋', label: 'Budget Requests' },
    { id: 'budgets',   icon: '📊', label: 'Monthly Budgets' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GH</div>
        <div className="sidebar-title">GuestHouse</div>
        <div className="sidebar-role">Manager</div>
      </div>
      <div className="sidebar-user"><strong>{fullName}</strong>Staff Portal</div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(i => (
          <button key={i.id} className={`nav-item ${active === i.id ? 'active' : ''}`} onClick={() => setActive(i.id)}>
            <span className="nav-icon">{i.icon}</span>{i.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}><span>🚪</span> Sign Out</button>
      </div>
    </aside>
  );
}

// ── Overview ──────────────────────────────────────────────
function Overview({ rooms, allocations, payments, requests, setActive }) {
  const revenue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pending  = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛏️</div>
          <div className="stat-value">{rooms.length}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-value">{rooms.filter(r => r.status === 'OCCUPIED').length}</div>
          <div className="stat-label">Occupied</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{fmt(revenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending Requests</div>
        </div>
      </div>

      {pending > 0 && (
        <div className="alert alert-warning" style={{marginBottom:'1.5rem'}}>
          ⚠️ You have <strong>{pending}</strong> budget request{pending > 1 ? 's' : ''} awaiting review.
          <button className="btn btn-ghost btn-sm" style={{marginLeft:'1rem'}} onClick={() => setActive('requests')}>Review Now</button>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Allocations</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Guest</th><th>Room</th><th>Checked In</th><th>Checked Out</th><th>Status</th></tr></thead>
            <tbody>
              {allocations.slice(0, 6).map(a => (
                <tr key={a.id}>
                  <td><strong>{a.guest_name}</strong></td>
                  <td>Room {a.room}</td>
                  <td>{fmtDate(a.checked_in_at)}</td>
                  <td>{fmtDate(a.checked_out_at)}</td>
                  <td>{a.checked_out_at ? <span className="badge badge-gray">Checked Out</span> : <span className="badge badge-green">Active</span>}</td>
                </tr>
              ))}
              {allocations.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No allocations yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Manage Rooms ──────────────────────────────────────────
function ManageRooms({ rooms, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ room_no:'', room_class:'STANDARD', capacity:1, status:'AVAILABLE', price_per_night:'' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const openNew  = () => { setEditing(null); setForm({ room_no:'', room_class:'STANDARD', capacity:1, status:'AVAILABLE', price_per_night:'' }); setShowForm(true); };
  const openEdit = (r) => { setEditing(r); setForm({ room_no: r.room_no, room_class: r.room_class, capacity: r.capacity, status: r.status, price_per_night: r.price_per_night }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) await api.put(`/api/rooms/${editing.id}/`, { ...form, capacity: parseInt(form.capacity) });
      else          await api.post('/api/rooms/', { ...form, capacity: parseInt(form.capacity) });
      setShowForm(false); onSuccess();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? JSON.stringify(d) : 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try { await api.delete(`/api/rooms/${id}/`); onSuccess(); }
    catch (err) { alert(err.response?.data?.detail || 'Delete failed.'); }
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}>
        <button className="btn btn-primary" onClick={openNew}>+ Add Room</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Room' : 'New Room'}</span>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Room Number</label>
                    <input value={form.room_no} onChange={e => setForm({...form, room_no: e.target.value})} placeholder="e.g. 101" required />
                  </div>
                  <div className="form-group">
                    <label>Class</label>
                    <select value={form.room_class} onChange={e => setForm({...form, room_class: e.target.value})}>
                      <option value="STANDARD">Standard</option>
                      <option value="DELUXE">Deluxe</option>
                      <option value="SUITE">Suite</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capacity</label>
                    <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group span-2">
                    <label>Price Per Night (K)</label>
                    <input type="number" step="0.01" value={form.price_per_night} onChange={e => setForm({...form, price_per_night: e.target.value})} placeholder="0.00" required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"/>Saving…</> : (editing ? 'Update Room' : 'Create Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">All Rooms</span><span className="badge badge-blue">{rooms.length} rooms</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Room</th><th>Class</th><th>Capacity</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.room_no}</strong></td>
                    <td>{r.room_class}</td>
                    <td>{r.capacity}</td>
                    <td>{fmt(r.price_per_night)}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{display:'flex', gap:'0.5rem'}}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
                      <button className="btn btn-sm" style={{background:'var(--danger-bg)', color:'var(--danger)'}} onClick={() => handleDelete(r.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Budget Requests Review ────────────────────────────────
function BudgetRequestsReview({ requests, onSuccess, loading }) {
  const [reviewing, setReviewing] = useState(null);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (status) => {
    setSubmitting(true);
    try {
      await api.post(`/api/budget-requests/${reviewing.id}/submit_review/`, { status, comment });
      setReviewing(null); setComment(''); onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Review failed.');
    } finally { setSubmitting(false); }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const reviewed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div>
      {reviewing && (
        <div className="modal-overlay" onClick={() => setReviewing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Review Request</span>
              <button className="modal-close" onClick={() => setReviewing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{background:'var(--off-white)', borderRadius:'var(--radius-sm)', padding:'1rem', marginBottom:'1.25rem'}}>
                <p style={{fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'0.3rem'}}>Amount</p>
                <p style={{fontFamily:'var(--font-serif)', fontSize:'1.3rem'}}>{fmt(reviewing.amount)}</p>
                <p style={{fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.75rem', marginBottom:'0.3rem'}}>Purpose</p>
                <p style={{fontSize:'0.88rem'}}>{reviewing.purpose}</p>
              </div>
              <div className="form-group">
                <label>Comment (optional)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment for the receptionist…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={submitting} onClick={() => handleReview('REJECTED')}>
                {submitting ? <><span className="spinner"/>…</> : '✕ Reject'}
              </button>
              <button className="btn btn-success" disabled={submitting} onClick={() => handleReview('APPROVED')}>
                {submitting ? <><span className="spinner"/>…</> : '✓ Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header">
            <span className="card-title">Pending Review</span>
            <span className="badge badge-gold">{pending.length} pending</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>Purpose</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td><strong>{fmt(r.amount)}</strong></td>
                    <td>{r.purpose}</td>
                    <td><button className="btn btn-primary btn-sm" onClick={() => { setReviewing(r); setComment(''); }}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Review History</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>Purpose</th><th>Status</th></tr></thead>
              <tbody>
                {reviewed.map(r => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}</td>
                    <td>{fmt(r.amount)}</td>
                    <td>{r.purpose}</td>
                    <td>{reqBadge(r.status)}</td>
                  </tr>
                ))}
                {reviewed.length === 0 && <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon">📋</div><p>No reviewed requests yet</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Monthly Budgets ───────────────────────────────────────
function MonthlyBudgets({ budgets, onSuccess, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ effective_month: '', items: [{ description: '', cost: '' }] });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(null);

  const addItem    = () => setForm({ ...form, items: [...form.items, { description: '', cost: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/api/budgets/', {
        effective_month: form.effective_month + '-01',
        items: form.items.map(it => ({ description: it.description, cost: it.cost })),
      });
      setShowForm(false); setForm({ effective_month: '', items: [{ description: '', cost: '' }] }); onSuccess();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? JSON.stringify(d) : 'Failed to create budget.');
    } finally { setSaving(false); }
  };

  const handleSubmitForApproval = async (id) => {
    setSubmitting(id);
    try { await api.post(`/api/budgets/${id}/submit_for_approval/`); onSuccess(); }
    catch (err) { alert(err.response?.data?.detail || 'Submission failed.'); }
    finally { setSubmitting(null); }
  };

  const totalItems = (items) => (items || []).reduce((s, i) => s + parseFloat(i.cost || 0), 0);

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'1rem'}}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Budget</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{maxWidth:620}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Monthly Budget</span>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-group" style={{marginBottom:'1.5rem'}}>
                  <label>Month</label>
                  <input type="month" value={form.effective_month} onChange={e => setForm({...form, effective_month: e.target.value})} required />
                </div>
                <p style={{fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'0.75rem'}}>Line Items</p>
                {form.items.map((item, i) => (
                  <div key={i} style={{display:'flex', gap:'0.75rem', alignItems:'flex-end', marginBottom:'0.75rem'}}>
                    <div className="form-group" style={{flex:2}}>
                      {i === 0 && <label>Description</label>}
                      <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="e.g. Housekeeping supplies" required />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      {i === 0 && <label>Cost (K)</label>}
                      <input type="number" step="0.01" value={item.cost} onChange={e => updateItem(i, 'cost', e.target.value)} placeholder="0.00" required />
                    </div>
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-sm" style={{background:'var(--danger-bg)', color:'var(--danger)', marginBottom:'0'}} onClick={() => removeItem(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Line Item</button>
                <div style={{marginTop:'1rem', padding:'0.75rem 1rem', background:'var(--off-white)', borderRadius:'var(--radius-sm)', fontSize:'0.88rem'}}>
                  Total: <strong>{fmt(totalItems(form.items))}</strong>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"/>Creating…</> : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Monthly Budgets</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Total Amount</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {budgets.map(b => (
                  <tr key={b.id}>
                    <td><strong>{new Date(b.effective_month).toLocaleDateString('en-GB', {month:'long', year:'numeric'})}</strong></td>
                    <td>{fmt(b.total_amount)}</td>
                    <td>{reqBadge(b.status)}</td>
                    <td>
                      {b.status === 'DRAFT' && (
                        <button className="btn btn-outline btn-sm" disabled={submitting === b.id} onClick={() => handleSubmitForApproval(b.id)}>
                          {submitting === b.id ? 'Submitting…' : '📤 Submit for Approval'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {budgets.length === 0 && <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon">📊</div><p>No budgets created yet</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── All Guests View ───────────────────────────────────────
function AllGuestsView({ allocations, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">All Allocations</span>
        <span className="badge badge-blue">{allocations.length} total</span>
      </div>
      {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Guest</th><th>Contact</th><th>Room</th><th>Checked In</th><th>Checked Out</th><th>Status</th></tr></thead>
            <tbody>
              {allocations.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.guest_name}</strong></td>
                  <td>{a.guest_contact}</td>
                  <td>Room {a.room}</td>
                  <td>{fmtDate(a.checked_in_at)}</td>
                  <td>{fmtDate(a.checked_out_at)}</td>
                  <td>{a.checked_out_at ? <span className="badge badge-gray">Checked Out</span> : <span className="badge badge-green">Active</span>}</td>
                </tr>
              ))}
              {allocations.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div><p>No allocations yet</p></div></td></tr>}
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
        <div className="stat-card green"><div className="stat-icon">💰</div><div className="stat-value">{fmt(total)}</div><div className="stat-label">Total Revenue</div></div>
        <div className="stat-card"><div className="stat-icon">🧾</div><div className="stat-value">{payments.length}</div><div className="stat-label">Transactions</div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">All Payments</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Booking</th><th>Amount</th><th>Method</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>Booking #{p.allocation}</td>
                    <td><strong>{fmt(p.amount)}</strong></td>
                    <td><span className="badge badge-blue">{p.payment_method}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={3}><div className="empty-state"><div className="empty-icon">💳</div><p>No payments yet</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function ManagerDashboard({ user, onLogout }) {
  const [active, setActive]           = useState('overview');
  const [rooms, setRooms]             = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [payments, setPayments]       = useState([]);
  const [requests, setRequests]       = useState([]);
  const [budgets, setBudgets]         = useState([]);
  const [loading, setLoading]         = useState(true);

  const titles = {
    overview: 'Overview', rooms: 'Manage Rooms', guests: 'All Guests',
    payments: 'Payments', requests: 'Budget Requests', budgets: 'Monthly Budgets',
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a, p, b, bu] = await Promise.all([
        api.get('/api/rooms/', { timeout: 60000 }),
        api.get('/api/room-allocations/', { timeout: 60000 }),
        api.get('/api/payments/', { timeout: 60000 }),
        api.get('/api/budget-requests/', { timeout: 60000 }),
        api.get('/api/budgets/', { timeout: 60000 }),
      ]);
      setRooms(r.data.results || r.data);
      setAllocations(a.data.results || a.data);
      setPayments(p.data.results || p.data);
      setRequests(b.data.results || b.data);
      setBudgets(bu.data.results || bu.data);
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
          {active === 'overview'  && <Overview rooms={rooms} allocations={allocations} payments={payments} requests={requests} setActive={setActive} />}
          {active === 'rooms'     && <ManageRooms rooms={rooms} onSuccess={fetchAll} loading={loading} />}
          {active === 'guests'    && <AllGuestsView allocations={allocations} loading={loading} />}
          {active === 'payments'  && <PaymentsView payments={payments} loading={loading} />}
          {active === 'requests'  && <BudgetRequestsReview requests={requests} onSuccess={fetchAll} loading={loading} />}
          {active === 'budgets'   && <MonthlyBudgets budgets={budgets} onSuccess={fetchAll} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
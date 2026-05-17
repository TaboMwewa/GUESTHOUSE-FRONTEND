import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import './theme.css';

const fmt = (amt) => `K ${parseFloat(amt || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function reqBadge(s) {
  const map = { PENDING: 'badge-gold', APPROVED: 'badge-green', REJECTED: 'badge-red', DRAFT: 'badge-gray', SUBMITTED: 'badge-blue' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
}

function Sidebar({ active, setActive, fullName, onLogout }) {
  const navItems = [
    { id: 'overview', icon: '🏠', label: 'Overview' },
    { id: 'budgets',  icon: '📊', label: 'Monthly Budgets' },
    { id: 'rooms',    icon: '🛏️', label: 'Rooms' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GH</div>
        <div className="sidebar-title">GuestHouse</div>
        <div className="sidebar-role">Owner</div>
      </div>
      <div className="sidebar-user"><strong>{fullName}</strong>Owner Portal</div>
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
function Overview({ budgets, rooms, payments, setActive }) {
  const submitted = budgets.filter(b => b.status === 'SUBMITTED').length;
  const totalRevenue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const approvedBudgetsTotal = budgets.filter(b => b.status === 'APPROVED').reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{fmt(totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-value">{occupied} / {rooms.length}</div>
          <div className="stat-label">Rooms Occupied</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{submitted}</div>
          <div className="stat-label">Budgets Awaiting Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{fmt(approvedBudgetsTotal)}</div>
          <div className="stat-label">Approved Budget Total</div>
        </div>
      </div>

      {submitted > 0 && (
        <div className="alert alert-warning" style={{marginBottom:'1.5rem'}}>
          ⚠️ <strong>{submitted}</strong> monthly budget{submitted > 1 ? 's' : ''} awaiting your approval.
          <button className="btn btn-ghost btn-sm" style={{marginLeft:'1rem'}} onClick={() => setActive('budgets')}>Review Now</button>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Budgets</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {budgets.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td><strong>{new Date(b.effective_month).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}</strong></td>
                  <td>{fmt(b.total_amount)}</td>
                  <td>{reqBadge(b.status)}</td>
                </tr>
              ))}
              {budgets.length === 0 && <tr><td colSpan={3} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No budgets yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Monthly Budgets with Approval ─────────────────────────
function BudgetsView({ budgets, onSuccess, loading }) {
  const [reviewing, setReviewing]   = useState(null);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [items, setItems]           = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadItems = async (budgetId) => {
    if (expanded === budgetId) { setExpanded(null); return; }
    setExpanded(budgetId); setLoadingItems(true);
    try {
      const res = await api.get('/api/budget-items/');
      const all = res.data.results || res.data;
      setItems(all.filter(i => i.budget === budgetId));
    } catch { setItems([]); }
    finally { setLoadingItems(false); }
  };

  const handleReview = async (status) => {
    setSubmitting(true);
    try {
      await api.post(`/api/budgets/${reviewing.id}/review_budget/`, { status, comment });
      setReviewing(null); setComment(''); onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Review failed.');
    } finally { setSubmitting(false); }
  };

  const submitted = budgets.filter(b => b.status === 'SUBMITTED');
  const others    = budgets.filter(b => b.status !== 'SUBMITTED');

  return (
    <div>
      {reviewing && (
        <div className="modal-overlay" onClick={() => setReviewing(null)}>
          <div className="modal" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Approve / Reject Budget</span>
              <button className="modal-close" onClick={() => setReviewing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{background:'var(--off-white)', borderRadius:'var(--radius-sm)', padding:'1rem', marginBottom:'1.25rem'}}>
                <p style={{fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.2rem'}}>Month</p>
                <p style={{fontFamily:'var(--font-serif)', fontSize:'1.1rem', marginBottom:'0.75rem'}}>
                  {new Date(reviewing.effective_month).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}
                </p>
                <p style={{fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.2rem'}}>Total Amount</p>
                <p style={{fontFamily:'var(--font-serif)', fontSize:'1.4rem', color:'var(--charcoal)'}}>{fmt(reviewing.total_amount)}</p>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add your comments here…" />
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

      {submitted.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <div className="card-header">
            <span className="card-title">Awaiting Your Approval</span>
            <span className="badge badge-gold">{submitted.length} pending</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Total</th><th>Items</th><th>Action</th></tr></thead>
              <tbody>
                {submitted.map(b => (
                  <>
                    <tr key={b.id}>
                      <td><strong>{new Date(b.effective_month).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}</strong></td>
                      <td><strong>{fmt(b.total_amount)}</strong></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => loadItems(b.id)}>
                          {expanded === b.id ? '▲ Hide' : '▼ View'} Items
                        </button>
                      </td>
                      <td><button className="btn btn-primary btn-sm" onClick={() => { setReviewing(b); setComment(''); }}>Review</button></td>
                    </tr>
                    {expanded === b.id && (
                      <tr key={`${b.id}-items`}>
                        <td colSpan={4} style={{padding:'0 1rem 1rem'}}>
                          {loadingItems ? <div className="loading-center"><div className="spinner spinner-dark"/>Loading items…</div> : (
                            <table style={{width:'100%', fontSize:'0.82rem'}}>
                              <thead><tr><th>Description</th><th>Cost</th></tr></thead>
                              <tbody>
                                {items.map(it => (
                                  <tr key={it.id}>
                                    <td>{it.description}</td>
                                    <td>{fmt(it.cost)}</td>
                                  </tr>
                                ))}
                                {items.length === 0 && <tr><td colSpan={2} style={{color:'var(--text-muted)'}}>No line items found</td></tr>}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Budget History</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Total Amount</th><th>Status</th></tr></thead>
              <tbody>
                {others.map(b => (
                  <tr key={b.id}>
                    <td><strong>{new Date(b.effective_month).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}</strong></td>
                    <td>{fmt(b.total_amount)}</td>
                    <td>{reqBadge(b.status)}</td>
                  </tr>
                ))}
                {others.length === 0 && <tr><td colSpan={3}><div className="empty-state"><div className="empty-icon">📊</div><p>No budget history yet</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rooms (read-only) ─────────────────────────────────────
function RoomsView({ rooms, loading }) {
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied  = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;

  return (
    <div>
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)', maxWidth:600, marginBottom:'1.5rem'}}>
        <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-value">{available}</div><div className="stat-label">Available</div></div>
        <div className="stat-card"><div className="stat-icon">🔑</div><div className="stat-value">{occupied}</div><div className="stat-label">Occupied</div></div>
        <div className="stat-card gold"><div className="stat-icon">🔧</div><div className="stat-value">{maintenance}</div><div className="stat-label">Maintenance</div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">All Rooms</span></div>
        {loading ? <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Room</th><th>Class</th><th>Capacity</th><th>Price / Night</th><th>Status</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.room_no}</strong></td>
                    <td>{r.room_class}</td>
                    <td>{r.capacity}</td>
                    <td>{fmt(r.price_per_night)}</td>
                    <td><span className={`badge ${r.status === 'AVAILABLE' ? 'badge-green' : r.status === 'OCCUPIED' ? 'badge-red' : 'badge-gold'}`}>{r.status}</span></td>
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

// ── Main ──────────────────────────────────────────────────
export default function OwnerDashboard({ user, onLogout }) {
  const [active, setActive]   = useState('overview');
  const [budgets, setBudgets] = useState([]);
  const [rooms, setRooms]     = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const titles = { overview: 'Overview', budgets: 'Monthly Budgets', rooms: 'Rooms' };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, p] = await Promise.all([
        api.get('/api/budgets/', { timeout: 60000 }),
        api.get('/api/rooms/', { timeout: 60000 }),
        api.get('/api/payments/', { timeout: 60000 }),
      ]);
      setBudgets(b.data.results || b.data);
      setRooms(r.data.results || r.data);
      setPayments(p.data.results || p.data);
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
          {active === 'overview' && <Overview budgets={budgets} rooms={rooms} payments={payments} setActive={setActive} />}
          {active === 'budgets'  && <BudgetsView budgets={budgets} onSuccess={fetchAll} loading={loading} />}
          {active === 'rooms'    && <RoomsView rooms={rooms} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
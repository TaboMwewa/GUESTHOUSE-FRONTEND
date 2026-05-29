import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import api from '../api/api';
import Sidebar from '../components/common/Sidebar';
import StatsGrid from '../components/overview/StatsGrid';
import StatsCard from '../components/common/StatsCard';
import RoomList from '../components/rooms/RoomList';
import BudgetReviewModal from '../components/budget/BudgetReviewModal';
import Analytics from '../components/analytics/Analytics';
import UpcomingCheckouts from '../components/common/UpcomingCheckouts';
import { BUDGET_STATUS } from '../utils/constants';
import { fmt, formatMonth } from '../utils/formatters';
import { getBadgeConfig } from '../utils/badges';
import './theme.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BudgetStatusBadge({ status }) {
  const config = getBadgeConfig(status);
  return <span className={`badge ${config.class}`}>{config.label}</span>;
}

/**
 * Safely extracts an array from an API response.
 *
 * Handles three common Django REST Framework shapes:
 *   1. Paginated:     { count, next, previous, results: [...] }
 *   2. Unpaginated:   [...]
 *   3. Wrapped:       { data: [...] }  (less common but seen in some setups)
 *
 * If the result is not an array after extraction, logs a warning and returns [].
 */
function extractArray(data, resourceName) {
  let result;

  if (Array.isArray(data)) {
    result = data;
  } else if (data && Array.isArray(data.results)) {
    result = data.results;
  } else if (data && Array.isArray(data.data)) {
    result = data.data;
  } else {
    console.error(
      `❌ [OwnerDashboard] "${resourceName}" — unexpected shape, cannot extract array.`,
      '\n  Received:', data,
      '\n  Type:', typeof data,
      '\n  Keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A'
    );
    return [];
  }

  console.log(`✅ [OwnerDashboard] "${resourceName}" extracted ${result.length} items.`, result.slice(0, 2));
  return result;
}

/**
 * Fetches ALL pages of a paginated DRF endpoint.
 * Falls back gracefully if the endpoint is unpaginated.
 */
async function fetchAllPages(endpoint, resourceName) {
  const allItems = [];
  let url = endpoint;
  let page = 1;

  while (url) {
    const res = await api.get(url);
    const data = res.data;

    if (Array.isArray(data)) {
      // Unpaginated — return immediately
      console.log(`✅ [OwnerDashboard] "${resourceName}" is unpaginated, got ${data.length} items.`);
      return data;
    }

    if (data && Array.isArray(data.results)) {
      allItems.push(...data.results);
      console.log(`📄 [OwnerDashboard] "${resourceName}" page ${page}: ${data.results.length} items (total so far: ${allItems.length} / ${data.count ?? '?'})`);

      // data.next is an absolute URL — pass it directly to axios if your
      // api instance supports absolute URLs, otherwise strip the base.
      url = data.next || null;
      page++;
    } else {
      // Unknown shape — extract what we can and stop
      const items = extractArray(data, resourceName);
      allItems.push(...items);
      url = null;
    }
  }

  console.log(`✅ [OwnerDashboard] "${resourceName}" fully fetched: ${allItems.length} total items.`);
  return allItems;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function Overview({ budgets, rooms, payments, allocations, setActive }) {
  const pendingBudgets = budgets.filter(b => b.status === BUDGET_STATUS.PENDING).length;
  const totalRevenue   = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const approvedTotal  = budgets
    .filter(b => b.status === BUDGET_STATUS.APPROVED)
    .reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;

  const maintenanceRooms = rooms.filter(r => r.status?.toUpperCase() === 'MAINTENANCE');

  // Last 7 days revenue sparkline
  const revenueTrend = (() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayRevenue = payments
        .filter(p => (p.created_at || p.date || '').split('T')[0] === dayStr)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      result.push(dayRevenue);
    }
    return result;
  })();

  const stats = [
    { icon: 'occupied',          value: `${occupied} / ${rooms.length}`, label: 'Rooms Occupied',   variant: 'default', format: false },
    { icon: 'awaiting-approval', value: pendingBudgets,                  label: 'Pending Approval',  variant: 'gold',    format: false },
    { icon: 'approved-budget',   value: approvedTotal,                   label: 'Approved Budgets',  variant: 'default', format: true  },
  ];

  return (
    <div>
      <div className="stats-grid">
        <StatsCard
          icon="revenue"
          value={totalRevenue}
          label="Total Revenue"
          variant="green"
          format={true}
          trend={revenueTrend}
        />
      </div>

      <StatsGrid stats={stats} />

      {maintenanceRooms.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #e76f51' }}>
          <div className="card-header">
            <span className="card-title">🔧 Maintenance Alerts</span>
            <span className="badge badge-red">{maintenanceRooms.length} rooms</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Room</th><th>Class</th><th>Status</th></tr>
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

      <UpcomingCheckouts allocations={allocations} rooms={rooms} />

      {pendingBudgets > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <strong>{pendingBudgets}</strong> monthly budget{pendingBudgets > 1 ? 's' : ''} awaiting your approval.
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: '1rem' }}
            onClick={() => setActive('budgets')}
          >
            Review Now
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Budgets</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {budgets.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td><strong>{formatMonth(b.effective_month)}</strong></td>
                  <td>{fmt(b.total_amount)}</td>
                  <td><BudgetStatusBadge status={b.status} /></td>
                </tr>
              ))}
              {budgets.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No budgets yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Budgets View ─────────────────────────────────────────────────────────────

function BudgetsView({ budgets, onSuccess, loading }) {
  const [reviewing,    setReviewing]    = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [expandedId,   setExpandedId]   = useState(null);
  const [items,        setItems]        = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadItems = async (budgetId) => {
    if (expandedId === budgetId) { setExpandedId(null); return; }
    setExpandedId(budgetId);
    setLoadingItems(true);
    try {
      const res = await api.get('/budget-items/');
      const all = extractArray(res.data, 'budget-items');
      setItems(all.filter(i => i.budget === budgetId));
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleReview = async (budgetId, status, comment) => {
    await api.post(`/budgets/${budgetId}/review_budget/`, { status, comment });
    onSuccess();
  };

  const openReview = (budget) => {
    setReviewing({ ...budget, items: items.filter(i => i.budget === budget.id) });
    setShowModal(true);
  };

  const pendingBudgets = budgets.filter(b => b.status === BUDGET_STATUS.PENDING);
  const otherBudgets   = budgets.filter(b => b.status !== BUDGET_STATUS.PENDING);

  return (
    <div>
      <BudgetReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        budget={reviewing}
        onReview={handleReview}
        isRequest={false}
      />

      {pendingBudgets.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Awaiting Your Approval</span>
            <span className="badge badge-gold">{pendingBudgets.length} pending</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Month</th><th>Total</th><th>Items</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pendingBudgets.map(b => (
                  <React.Fragment key={b.id}>
                    <tr>
                      <td><strong>{formatMonth(b.effective_month)}</strong></td>
                      <td><strong>{fmt(b.total_amount)}</strong></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => loadItems(b.id)}>
                          {expandedId === b.id ? 'Hide Items' : 'View Items'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => openReview(b)}>
                          Review
                        </button>
                      </td>
                    </tr>
                    {expandedId === b.id && (
                      <tr>
                        <td colSpan={4} style={{ padding: '0 1rem 1rem' }}>
                          {loadingItems ? (
                            <div className="loading-center">
                              <div className="spinner spinner-dark" />Loading items…
                            </div>
                          ) : (
                            <table style={{ width: '100%', fontSize: '0.82rem' }}>
                              <thead><tr><th>Description</th><th>Cost</th></tr></thead>
                              <tbody>
                                {items.map(it => (
                                  <tr key={it.id}>
                                    <td>{it.description}</td>
                                    <td>{fmt(it.cost)}</td>
                                  </tr>
                                ))}
                                {items.length === 0 && (
                                  <tr>
                                    <td colSpan={2} style={{ color: 'var(--text-muted)' }}>
                                      No line items found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Budget History</span>
        </div>
        {loading ? (
          <div className="loading-center">
            <div className="spinner spinner-dark" /><span>Loading…</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Month</th><th>Total Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {otherBudgets.map(b => (
                  <tr key={b.id}>
                    <td><strong>{formatMonth(b.effective_month)}</strong></td>
                    <td>{fmt(b.total_amount)}</td>
                    <td><BudgetStatusBadge status={b.status} /></td>
                  </tr>
                ))}
                {otherBudgets.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">
                        <div className="empty-icon" />
                        <p>No budget history yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rooms View ───────────────────────────────────────────────────────────────

function RoomsView({ rooms, loading }) {
  const available   = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied    = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;

  const stats = [
    { icon: 'available',   value: available,   label: 'Available',   variant: 'green'   },
    { icon: 'occupied',    value: occupied,    label: 'Occupied',    variant: 'default' },
    { icon: 'maintenance', value: maintenance, label: 'Maintenance', variant: 'gold'    },
  ];

  return (
    <div>
      <StatsGrid stats={stats} />
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Rooms</span>
        </div>
        <RoomList rooms={rooms} loading={loading} showActions={false} />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function OwnerDashboard({ user, onLogout }) {
  const [active,      setActive]      = useState('overview');
  const [budgets,     setBudgets]     = useState([]);
  const [rooms,       setRooms]       = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [allocations, setAllocations] = useState([]);

  // Separate loading flags so a re-fetch (e.g. after budget approval) doesn't
  // blank out data in other tabs that is already loaded and still valid.
  const [loading, setLoading] = useState({
    budgets:     true,
    rooms:       true,
    payments:    true,
    allocations: true,
  });

  const isInitialLoad = Object.values(loading).some(Boolean);

  const titles    = { overview: 'Overview', budgets: 'Monthly Budgets', rooms: 'Rooms', analytics: 'Analytics' };
  const navItems  = [
    { id: 'overview',   icon: 'overview',   label: 'Overview'         },
    { id: 'budgets',    icon: 'budgets',    label: 'Monthly Budgets'  },
    { id: 'rooms',      icon: 'rooms',      label: 'Rooms'            },
    { id: 'analytics',  icon: 'analytics',  label: 'Analytics'        },
  ];

  // Individual fetchers so we can re-fetch only what changed (e.g. budgets after approval)
  const fetchBudgets = useCallback(async () => {
    setLoading(prev => ({ ...prev, budgets: true }));
    try {
      const data = await fetchAllPages('/budgets/', 'budgets');
      setBudgets(data);
    } catch (err) {
      console.error('❌ Budgets fetch failed:', err);
      setBudgets([]);
    } finally {
      setLoading(prev => ({ ...prev, budgets: false }));
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(prev => ({ ...prev, rooms: true }));
    try {
      const data = await fetchAllPages('/rooms/', 'rooms');
      setRooms(data);
    } catch (err) {
      console.error('❌ Rooms fetch failed:', err);
      setRooms([]);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(prev => ({ ...prev, payments: true }));
    try {
      const data = await fetchAllPages('/payments/', 'payments');
      setPayments(data);
    } catch (err) {
      console.error('❌ Payments fetch failed:', err);
      setPayments([]);
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  }, []);

  const fetchAllocations = useCallback(async () => {
    setLoading(prev => ({ ...prev, allocations: true }));
    try {
      const data = await fetchAllPages('/room-allocations/', 'allocations');
      setAllocations(data);
    } catch (err) {
      console.warn('⚠️ Room allocations unavailable — analytics will be limited:', err);
      setAllocations([]);
    } finally {
      setLoading(prev => ({ ...prev, allocations: false }));
    }
  }, []);

  // Full refresh — runs in parallel; each resource resolves independently
  const fetchAll = useCallback(() => {
    fetchBudgets();
    fetchRooms();
    fetchPayments();
    fetchAllocations();
  }, [fetchBudgets, fetchRooms, fetchPayments, fetchAllocations]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Analytics only needs to show its own spinner on the very first load
  const analyticsLoading = loading.rooms || loading.allocations || loading.payments;

  return (
    <div className="dashboard">
      <Sidebar
        active={active}
        setActive={setActive}
        fullName={user.fullName}
        role="Owner"
        onLogout={onLogout}
        navItems={navItems}
      />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{titles[active]}</span>
          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="page-body">
          {active === 'overview' && (
            <Overview
              budgets={budgets}
              rooms={rooms}
              payments={payments}
              allocations={allocations}
              setActive={setActive}
            />
          )}
          {active === 'budgets' && (
            // Only re-fetch budgets on approval success, not everything
            <BudgetsView budgets={budgets} onSuccess={fetchBudgets} loading={loading.budgets} />
          )}
          {active === 'rooms' && (
            <RoomsView rooms={rooms} loading={loading.rooms} />
          )}
          {active === 'analytics' && (
            <Analytics
              allocations={allocations}
              rooms={rooms}
              payments={payments}
              loading={analyticsLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
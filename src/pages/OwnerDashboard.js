import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import api from '../api/api';
import Sidebar from '../components/common/Sidebar';
import StatsGrid from '../components/overview/StatsGrid';
import RoomList from '../components/rooms/RoomList';
import BudgetReviewModal from '../components/budget/BudgetReviewModal';
import { BUDGET_STATUS } from '../utils/constants';
import { fmt, formatMonth } from '../utils/formatters';
import { getBadgeConfig } from '../utils/badges';
import './theme.css';

// Helper for budget status badge
function BudgetStatusBadge({ status }) {
  const config = getBadgeConfig(status);
  return <span className={`badge ${config.class}`}>{config.label}</span>;
}

// ── Overview Component ────────────────────────────────────
function Overview({ budgets, rooms, payments, setActive }) {
  const pendingBudgets = budgets.filter(b => b.status === BUDGET_STATUS.PENDING).length;
  const totalRevenue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const approvedTotal = budgets
    .filter(b => b.status === BUDGET_STATUS.APPROVED)
    .reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;

  const stats = [
    { icon: 'revenue', value: totalRevenue, label: 'Total Revenue', variant: 'green' },
    { icon: 'occupied', value: `${occupied} / ${rooms.length}`, label: 'Rooms Occupied', variant: 'default' },
    { icon: 'awaiting-approval', value: pendingBudgets, label: 'Pending Approval', variant: 'gold' },
    { icon: 'approved-budget', value: approvedTotal, label: 'Approved Budgets', variant: 'default' },
  ];

  return (
    <div>
      <StatsGrid stats={stats} />

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
              <tr>
                <th>Month</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
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

// ── Monthly Budgets with Approval ─────────────────────────
function BudgetsView({ budgets, onSuccess, loading }) {
  const [reviewing, setReviewing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadItems = async (budgetId) => {
    if (expandedId === budgetId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(budgetId);
    setLoadingItems(true);
    try {
      const res = await api.get('/budget-items/');
      const all = res.data.results || res.data;
      setItems(all.filter(i => i.budget === budgetId));
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleReview = async (budgetId, status, comment) => {
    await api.post(`/api/budgets/${budgetId}/review_budget/`, { status, comment });
    onSuccess();
  };

  const openReview = (budget) => {
    const budgetWithItems = { ...budget, items: items.filter(i => i.budget === budget.id) };
    setReviewing(budgetWithItems);
    setShowModal(true);
  };

  const pendingBudgets = budgets.filter(b => b.status === BUDGET_STATUS.PENDING);
  const otherBudgets = budgets.filter(b => b.status !== BUDGET_STATUS.PENDING);

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
                <tr>
                  <th>Month</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingBudgets.map(b => (
                  <React.Fragment key={b.id}>
                    <tr>
                      <td><strong>{formatMonth(b.effective_month)}</strong></td>
                      <td><strong>{fmt(b.total_amount)}</strong></td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => loadItems(b.id)}
                        >
                          {expandedId === b.id ? 'Hide Items' : 'View Items'}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openReview(b)}
                        >
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
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th>Cost</th>
                                </tr>
                              </thead>
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
            <div className="spinner spinner-dark" />
            <span>Loading…</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
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

// ── Rooms (read-only) ─────────────────────────────────────
function RoomsView({ rooms, loading }) {
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;

  const stats = [
    { icon: 'available', value: available, label: 'Available', variant: 'green' },
    { icon: 'occupied', value: occupied, label: 'Occupied', variant: 'default' },
    { icon: 'maintenance', value: maintenance, label: 'Maintenance', variant: 'gold' },
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

// ── Main Dashboard ────────────────────────────────────────
export default function OwnerDashboard({ user, onLogout }) {
  const [active, setActive] = useState('overview');
  const [budgets, setBudgets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const titles = {
    overview: 'Overview',
    budgets: 'Monthly Budgets',
    rooms: 'Rooms',
  };

  const navItems = [
    { id: 'overview', icon: 'overview', label: 'Overview' },
    { id: 'budgets', icon: 'budgets', label: 'Monthly Budgets' },
    { id: 'rooms', icon: 'rooms', label: 'Rooms' },
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, p] = await Promise.all([
        api.get('/budgets/'),
        api.get('/rooms/'),
        api.get('/payments/'),
      ]);
      setBudgets(b.data.results || b.data);
      setRooms(r.data.results || r.data);
      setPayments(p.data.results || p.data);
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
              budgets={budgets}
              rooms={rooms}
              payments={payments}
              setActive={setActive}
            />
          )}
          {active === 'budgets' && (
            <BudgetsView budgets={budgets} onSuccess={fetchAll} loading={loading} />
          )}
          {active === 'rooms' && <RoomsView rooms={rooms} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
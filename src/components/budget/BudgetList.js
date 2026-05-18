import { fmt, formatMonth } from '../../utils/formatters';
import Badge from '../common/Badge';
import Icon from '../common/Icon';

export default function BudgetList({ 
  budgets, 
  loading, 
  showSubmitButton = false, 
  onSubmit, 
  submittingId 
}) {
  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Amount</th>
            <th>Status</th>
            {showSubmitButton && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {budgets.map(budget => (
            <tr key={budget.id}>
              <td><strong>{formatMonth(budget.effective_month)}</strong></td>
              <td>{fmt(budget.total_amount)}</td>
              <td><Badge status={budget.status} /></td>
              {showSubmitButton && (
                <td>
                  {budget.status === 'DRAFT' && (
                    <button 
                      className="btn btn-outline btn-sm" 
                      disabled={submittingId === budget.id} 
                      onClick={() => onSubmit?.(budget.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {submittingId === budget.id ? (
                        <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Submitting…</>
                      ) : (
                        <>
                          <Icon name="submit" size={14} />
                          Submit for Approval
                        </>
                      )}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {budgets.length === 0 && (
            <tr>
              <td colSpan={showSubmitButton ? 4 : 3}>
                <div className="empty-state">
                  <Icon name="budgets" size={32} />
                  <p>No budgets created yet</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
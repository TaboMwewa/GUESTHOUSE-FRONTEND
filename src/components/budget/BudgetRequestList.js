import { fmt, fmtDate } from '../../utils/formatters';
import Badge from '../common/Badge';
import Icon from '../common/Icon';

export default function BudgetRequestList({ 
  requests, 
  loading, 
  showReviewButton = false, 
  onReview 
}) {
  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Purpose</th>
            <th>Status</th>
            {showReviewButton && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request.id}>
              <td>{fmtDate(request.date)}</td>
              <td><strong>{fmt(request.amount)}</strong></td>
              <td>{request.purpose}</td>
              <td><Badge status={request.status} /></td>
              {showReviewButton && request.status === 'PENDING' && (
                <td>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => onReview?.(request)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Icon name="review" size={14} />
                    Review
                  </button>
                </td>
              )}
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={showReviewButton ? 5 : 4}>
                <div className="empty-state">
                  <Icon name="requests" size={32} />
                  <p>No budget requests yet</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
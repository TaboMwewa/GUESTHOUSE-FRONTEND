import { fmt } from '../../utils/formatters';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import StatsCard from '../common/StatsCard';

export default function PaymentList({ payments, loading, showTotal = true }) {
  const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div>;
  }

  return (
    <div>
      {showTotal && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 500, marginBottom: '1.5rem' }}>
          <StatsCard 
            icon="revenue" 
            value={total} 
            label="Total Revenue" 
            variant="green" 
          />
          <StatsCard 
            icon="transactions" 
            value={payments.length} 
            label={payments.length === 1 ? 'Transaction' : 'Transactions'} 
            variant="default" 
            format={false}
          />
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Allocation ID</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>Booking #{p.allocation}</td>
                <td><strong>{fmt(p.amount)}</strong></td>
                <td><Badge status={p.payment_method} /></td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <Icon name="payments" size={32} />
                    <p>No payments recorded</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
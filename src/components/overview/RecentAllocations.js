import { fmtDate } from '../../utils/formatters';
import Badge from '../common/Badge';
import Icon from '../common/Icon';

export default function RecentAllocations({ allocations, limit = 5, showCheckoutButton = false, onCheckout }) {
  const active = allocations.filter(a => !a.checked_out_at);
  const displayAllocations = active.slice(0, limit);

  if (displayAllocations.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="guests" size={32} />
        <p>No active guests</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Contact</th>
            <th>Room</th>
            <th>Checked In</th>
            <th>Status</th>
            {showCheckoutButton && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {displayAllocations.map(a => (
            <tr key={a.id}>
              <td><strong>{a.guest_name}</strong></td>
              <td>{a.guest_contact}</td>
              <td>Room {a.room}</td>
              <td>{fmtDate(a.checked_in_at)}</td>
              <td><Badge status="ACTIVE" /></td>
              {showCheckoutButton && (
                <td>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => onCheckout?.(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Icon name="checkout" size={14} />
                    Check Out
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
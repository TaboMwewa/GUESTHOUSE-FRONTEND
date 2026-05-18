import { fmtDate } from '../../utils/formatters';
import Badge from '../common/Badge';
import Icon from '../common/Icon';

export default function GuestList({ allocations, loading, showCheckout = false, onCheckout, checkingOutId }) {
  const active = allocations.filter(a => !a.checked_out_at);
  const displayList = showCheckout ? active : allocations;

  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Contact</th>
            <th>Room</th>
            {showCheckout && <th>Occupants</th>}
            <th>Checked In</th>
            {showCheckout && <th>Action</th>}
            {!showCheckout && <th>Checked Out</th>}
            {!showCheckout && <th>Status</th>}
          </tr>
        </thead>
        <tbody>
          {displayList.map(a => (
            <tr key={a.id}>
              <td><strong>{a.guest_name}</strong></td>
              <td>{a.guest_contact}</td>
              <td>Room {a.room}</td>
              {showCheckout && <td>{a.no_of_occupants}</td>}
              <td>{fmtDate(a.checked_in_at)}</td>
              {showCheckout && (
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onCheckout?.(a.id)}
                    disabled={checkingOutId === a.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {checkingOutId === a.id ? (
                      <>
                        <span className="spinner" style={{ width: '12px', height: '12px' }} />
                        Checking out…
                      </>
                    ) : (
                      <>
                        <Icon name="checkout" size={14} />
                        Check Out
                      </>
                    )}
                  </button>
                </td>
              )}
              {!showCheckout && (
                <>
                  <td>{fmtDate(a.checked_out_at)}</td>
                  <td>
                    {a.checked_out_at ? 
                      <Badge status="CHECKED_OUT" /> : 
                      <Badge status="ACTIVE" />
                    }
                  </td>
                </>
              )}
            </tr>
          ))}
          {displayList.length === 0 && (
            <tr>
              <td colSpan={showCheckout ? 6 : 7}>
                <div className="empty-state">
                  <Icon name="guests" size={32} />
                  <p>{showCheckout ? 'No active guests' : 'No allocations yet'}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
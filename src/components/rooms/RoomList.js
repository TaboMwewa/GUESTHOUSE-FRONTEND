import { fmt } from '../../utils/formatters';
import Badge from '../common/Badge';
import Icon from '../common/Icon';

export default function RoomList({ rooms, loading, showActions = false, onEdit, onDelete }) {
  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-dark"/><span>Loading…</span></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Room</th>
            <th>Class</th>
            <th>Capacity</th>
            <th>Price / Night</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room.id}>
              <td><strong>{room.room_no}</strong></td>
              <td>{room.room_class}</td>
              <td>{room.capacity}</td>
              <td>{fmt(room.price_per_night)}</td>
              <td><Badge status={room.status} /></td>
              {showActions && (
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => onEdit?.(room)}>
                    <Icon name="edit" size={14} />
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm" 
                    style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} 
                    onClick={() => onDelete?.(room.id)}
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {rooms.length === 0 && (
            <tr>
              <td colSpan={showActions ? 6 : 5}>
                <div className="empty-state">
                  <Icon name="bed" size={32} />
                  <p>No rooms found</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
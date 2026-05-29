import { useState, useEffect } from 'react';

export default function UpcomingCheckouts({ allocations, rooms }) {
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    // Debug: log the first allocation to see available fields
    if (allocations.length > 0) {
      console.log('Sample allocation for upcoming checkouts:', allocations[0]);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const next3Days = [...Array(3)].map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const filtered = allocations.filter(a => {
      // Skip if already checked out
      if (a.checked_out_at) return false;
      
      // Try multiple possible field names for check-out date
      const checkout = a.check_out_date || a.checkout_date || a.checkOutDate || a.checkoutDate;
      if (!checkout) return false;
      
      // Normalise to YYYY-MM-DD
      const checkoutDateStr = new Date(checkout).toISOString().split('T')[0];
      return next3Days.includes(checkoutDateStr);
    });

    const enriched = filtered.map(a => ({
      ...a,
      roomNumber: rooms.find(r => r.id === a.room)?.number || a.room || '?'
    }));
    setUpcoming(enriched);
  }, [allocations, rooms]);

  if (upcoming.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <span className="card-title">🚪 Upcoming Check‑outs (next 3 days)</span>
        <span className="badge badge-gold">{upcoming.length} guests</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Check‑out date</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map(a => {
              const checkoutDate = a.check_out_date || a.checkout_date || a.checkOutDate;
              return (
                <tr key={a.id}>
                  <td>{a.guest_name || a.guestName || 'Guest'}</td>
                  <td>{a.roomNumber}</td>
                  <td>{checkoutDate ? new Date(checkoutDate).toLocaleDateString() : '?'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
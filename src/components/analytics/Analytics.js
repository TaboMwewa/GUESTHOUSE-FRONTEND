import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, BedDouble, Users, Activity, Globe, Flame,
  BarChart2, AlertTriangle, Hotel, MapPin
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  teal:       '#2a9d8f',
  tealLight:  '#e8f5f3',
  coral:      '#e76f51',
  coralLight: '#fdf0ec',
  gold:       '#e9c46a',
  goldLight:  '#fdf8ec',
  ink:        '#1a1f2e',
  muted:      '#6b7280',
  border:     '#e5e9f0',
  surface:    '#ffffff',
  bg:         '#f4f6fb',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (amt) =>
  `K ${parseFloat(amt || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`;

const getCountryFromPhone = (phone) => {
  const match = phone?.match(/\+(\d{1,3})/);
  if (!match) return 'Unknown';
  const code = match[1];
  const countryMap = {
    '1': 'USA/Canada', '260': 'Zambia', '27': 'S. Africa', '44': 'UK',
    '61': 'Australia', '49': 'Germany', '33': 'France', '86': 'China',
    '91': 'India', '234': 'Nigeria', '254': 'Kenya', '255': 'Tanzania',
    '263': 'Zimbabwe', '267': 'Botswana', '264': 'Namibia', '265': 'Malawi',
    '971': 'UAE', '966': 'Saudi Arabia', '31': 'Netherlands',
  };
  return countryMap[code] || `+${code}`;
};

// ─── Diagnostic logger ────────────────────────────────────────────────────────
const logDiagnostics = ({ rooms, allocations, payments, loading }) => {
  console.group('📊 Analytics Debug — prop snapshot');
  console.log('loading:', loading, '| type:', typeof loading);
  console.log('rooms — isArray:', Array.isArray(rooms), '| length:', Array.isArray(rooms) ? rooms.length : 'N/A');
  console.log('allocations — isArray:', Array.isArray(allocations), '| length:', Array.isArray(allocations) ? allocations.length : 'N/A');
  console.log('payments — isArray:', Array.isArray(payments), '| length:', Array.isArray(payments) ? payments.length : 'N/A');

  if (Array.isArray(rooms) && rooms.length > 0) {
    const r = rooms[0];
    console.group('🏨 rooms[0]'); console.log(r);
    console.log('id:', r.id, '| number:', r.number, '| status:', r.status, '| room_class:', r.room_class);
    const statusGroups = rooms.reduce((a, x) => {
      a[x.status || 'UNDEFINED'] = (a[x.status || 'UNDEFINED'] || 0) + 1; return a;
    }, {});
    console.log('Status breakdown:', statusGroups);
    console.groupEnd();
  } else { console.warn('⚠️ rooms is empty'); }

  if (Array.isArray(allocations) && allocations.length > 0) {
    const a = allocations[0];
    console.group('📋 allocations[0]'); console.log(a);
    console.log('room:', a.room, '| guest_contact:', a.guest_contact, '| checked_out_at:', a.checked_out_at);
    console.groupEnd();
  } else { console.warn('⚠️ allocations is empty'); }

  if (Array.isArray(allocations) && Array.isArray(rooms) && allocations.length && rooms.length) {
    const roomIds = new Set(rooms.map(r => r.id));
    const unmatched = allocations.filter(a => !roomIds.has(a.room));
    if (unmatched.length) {
      console.warn(`⚠️ ${unmatched.length} allocation(s) reference unknown room IDs — possible type mismatch`);
      console.log('Sample:', unmatched.slice(0, 3).map(a => ({ room: a.room, type: typeof a.room })));
      console.log('Room id sample:', [...roomIds].slice(0, 3).map(id => ({ id, type: typeof id })));
    } else { console.log('✅ All allocation room IDs match rooms[]'); }
  }

  if (Array.isArray(payments) && payments.length > 0) {
    const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    console.log('💵 Total revenue:', fmt(total));
    const bad = payments.filter(p => isNaN(parseFloat(p.amount)));
    if (bad.length) console.warn(`⚠️ ${bad.length} payment(s) with non-numeric amount`);
  }

  console.groupEnd();
};

const normalise = (val, name) => {
  if (!Array.isArray(val)) {
    console.error(`❌ Analytics: prop "${name}" is not an array — got:`, val, '(type:', typeof val, ')');
    return [];
  }
  return val;
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function KpiCard({ icon: IconComp, value, label, accent, bg }) {
  return (
    <div
      style={{
        background: PALETTE.surface,
        borderRadius: 16,
        padding: '1.4rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
        border: `1px solid ${PALETTE.border}`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)';
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 13,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IconComp size={22} color={accent} strokeWidth={1.75} />
      </div>
      <div>
        <div style={{ fontSize: '1.65rem', fontWeight: 700, color: PALETTE.ink, lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.78rem', color: PALETTE.muted, marginTop: 4, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ icon: IconComp, title, children, accent = PALETTE.teal, style: extra }) {
  return (
    <div style={{
      background: PALETTE.surface,
      borderRadius: 16,
      border: `1px solid ${PALETTE.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      ...extra,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '1rem 1.5rem',
        borderBottom: `1px solid ${PALETTE.border}`,
        background: PALETTE.bg,
      }}>
        <IconComp size={16} color={accent} strokeWidth={2} />
        <span style={{
          fontWeight: 650, fontSize: '0.845rem', color: PALETTE.ink, letterSpacing: '0.01em',
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8, color: PALETTE.muted,
    }}>
      <BarChart2 size={28} strokeWidth={1.25} />
      <span style={{ fontSize: '0.82rem' }}>{message}</span>
    </div>
  );
}

// Rounded-top bar shape
const RoundedBar = (props) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(6, width / 2);
  return (
    <path
      d={`M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`}
      fill={fill}
    />
  );
};

// Unified dark tooltip
const DarkTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: PALETTE.ink, color: '#fff', borderRadius: 10,
      padding: '0.55rem 0.9rem', fontSize: '0.8rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: 1.6,
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 2, color: '#9ca3af', fontSize: '0.75rem' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.fill || p.color || PALETTE.teal }} />
          <span style={{ fontWeight: 500 }}>{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Analytics component ─────────────────────────────────────────────────
export default function Analytics({ allocations: _allocations, rooms: _rooms, payments: _payments, loading }) {

  const rooms       = normalise(_rooms,       'rooms');
  const allocations = normalise(_allocations, 'allocations');
  const payments    = normalise(_payments,    'payments');

  logDiagnostics({ rooms, allocations, payments, loading });

  // Loading guard: only block if still loading AND no data has arrived yet
  if (loading && rooms.length === 0 && allocations.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: 320, gap: 14,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Activity size={32} color={PALETTE.teal} strokeWidth={1.5}
          style={{ animation: 'spin 1.2s linear infinite' }} />
        <span style={{ color: PALETTE.muted, fontSize: '0.875rem', fontWeight: 500 }}>
          Loading analytics…
        </span>
      </div>
    );
  }

  // ── Room popularity ───────────────────────────────────────────────────────
  const roomCount = {};
  rooms.forEach(room => { roomCount[room.id] = 0; });
  allocations.forEach(a => {
    const key = Object.keys(roomCount).find(k => String(k) === String(a.room));
    if (key !== undefined) roomCount[key]++;
    else console.warn(`⚠️ Allocation references unknown room id "${a.room}" — skipping`);
  });
  const roomChartData = Object.entries(roomCount)
    .map(([roomId, count]) => {
      const room = rooms.find(r => String(r.id) === String(roomId));
      return { room: `Rm ${room?.number ?? roomId}`, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Revenue trend ─────────────────────────────────────────────────────────
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const revenueByMonth = {};
  payments.forEach(p => {
    const raw = p.created_at || p.date;
    if (!raw) { console.warn('⚠️ Payment missing date:', p); return; }
    const date = new Date(raw);
    if (isNaN(date)) { console.warn('⚠️ Unparseable date:', raw); return; }
    const key = `${date.getFullYear()}-${monthNames[date.getMonth()]}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + parseFloat(p.amount || 0);
  });
  const last6Months = [...Array(6)].map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { month: monthNames[d.getMonth()], year: d.getFullYear() };
  }).reverse();
  const revenueChartData = last6Months.map(({ month, year }) => ({
    month: `${month} '${String(year).slice(2)}`,
    revenue: revenueByMonth[`${year}-${month}`] || 0,
  }));

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalBookings = allocations.length;
  const currentGuests = allocations.filter(a => !a.checked_out_at).length;
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
  const occupancyRate = rooms.length
    ? ((occupiedRooms / rooms.length) * 100).toFixed(1)
    : '0.0';

  console.log('🔢 KPIs — occupancyRate:', occupancyRate, '| totalBookings:', totalBookings, '| currentGuests:', currentGuests);

  // ── Room class pie ────────────────────────────────────────────────────────
  const classCount = { STANDARD: 0, DELUXE: 0, SUITE: 0 };
  rooms.forEach(r => {
    const cls = r.room_class?.toUpperCase();
    if (cls && classCount[cls] !== undefined) classCount[cls]++;
    else if (cls) console.warn(`⚠️ Unknown room_class: "${r.room_class}"`);
  });
  const roomClassData = [
    { name: 'Standard', value: classCount.STANDARD, color: PALETTE.teal  },
    { name: 'Deluxe',   value: classCount.DELUXE,   color: PALETTE.gold  },
    { name: 'Suite',    value: classCount.SUITE,     color: PALETTE.coral },
  ].filter(d => d.value > 0);

  // ── Occupancy donut ───────────────────────────────────────────────────────
  const available   = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied    = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const occupancyData = [
    { name: 'Available',   value: available,   color: PALETTE.teal  },
    { name: 'Occupied',    value: occupied,    color: PALETTE.coral  },
    { name: 'Maintenance', value: maintenance, color: PALETTE.gold   },
  ].filter(d => d.value > 0);

  // ── Guest origins ─────────────────────────────────────────────────────────
  const originCount = {};
  allocations.forEach(a => {
    const country = getCountryFromPhone(a.guest_contact);
    originCount[country] = (originCount[country] || 0) + 1;
  });
  const guestOriginsData = Object.entries(originCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxCount = guestOriginsData.length > 0
    ? Math.max(...guestOriginsData.map(c => c.count)) : 1;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Empty-state banner */}
      {rooms.length === 0 && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#fffbeb', border: '1px solid #f59e0b',
          borderRadius: 12, padding: '0.875rem 1.25rem',
          color: '#92400e', fontSize: '0.845rem', fontWeight: 500,
        }}>
          <AlertTriangle size={17} color="#f59e0b" strokeWidth={2} />
          No room data received. Open the browser console (F12) for diagnostic logs.
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        <KpiCard icon={Activity}  value={`${occupancyRate}%`} label="Occupancy Rate" accent={PALETTE.teal}  bg={PALETTE.tealLight}  />
        <KpiCard icon={Hotel}     value={totalBookings}        label="Total Bookings" accent={PALETTE.coral} bg={PALETTE.coralLight} />
        <KpiCard icon={Users}     value={currentGuests}        label="Current Guests" accent={PALETTE.gold}  bg={PALETTE.goldLight}  />
      </div>

      {/* Pie charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <SectionCard icon={Hotel} title="Room Class Distribution" accent={PALETTE.teal}>
          <div style={{ padding: '1rem', height: 300 }}>
            {roomClassData.length === 0
              ? <EmptyChart message="No room class data" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roomClassData} cx="50%" cy="50%" outerRadius={100}
                      dataKey="value" labelLine
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {roomClassData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                    <Legend iconType="circle" iconSize={9} />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </div>
        </SectionCard>

        <SectionCard icon={BedDouble} title="Room Occupancy Status" accent={PALETTE.coral}>
          <div style={{ padding: '1rem', height: 300 }}>
            {occupancyData.length === 0
              ? <EmptyChart message="No occupancy data" />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={occupancyData} cx="50%" cy="50%"
                      innerRadius={62} outerRadius={100}
                      paddingAngle={4} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {occupancyData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                    <Legend iconType="circle" iconSize={9} />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </div>
        </SectionCard>
      </div>

      {/* Room popularity bar chart */}
      <SectionCard icon={BarChart2} title="Room Popularity — Top 10 by Bookings" accent={PALETTE.coral}>
        <div style={{ padding: '1.25rem 0.75rem 1rem', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roomChartData} barCategoryGap="32%">
              <defs>
                <linearGradient id="gradCoral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={PALETTE.coral}  stopOpacity={1}    />
                  <stop offset="100%" stopColor="#f4a261"         stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} vertical={false} />
              <XAxis dataKey="room" tick={{ fill: PALETTE.muted, fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: PALETTE.muted, fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  <DarkTooltip active={active} payload={payload} label={label}
                    formatter={v => `${v} booking${v !== 1 ? 's' : ''}`} />}
                cursor={{ fill: 'rgba(231,111,81,0.06)' }}
              />
              <Bar dataKey="count" name="Bookings" fill="url(#gradCoral)"
                shape={<RoundedBar />} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Revenue trend */}
      <SectionCard icon={TrendingUp} title="Revenue Trend — Last 6 Months" accent={PALETTE.teal}>
        <div style={{ padding: '1.25rem 0.75rem 1rem', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: PALETTE.muted, fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `K${(v / 1000).toFixed(0)}k`}
                tick={{ fill: PALETTE.muted, fontSize: 12 }}
                axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  <DarkTooltip active={active} payload={payload} label={label}
                    formatter={v => fmt(v)} />}
                cursor={{ stroke: PALETTE.teal, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line type="monotone" dataKey="revenue" name="Revenue"
                stroke={PALETTE.teal} strokeWidth={2.5}
                dot={{ r: 4, fill: PALETTE.teal, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: PALETTE.teal, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Guest origins horizontal bar chart */}
      {guestOriginsData.length > 0 && (
        <SectionCard icon={Globe} title="Guest Origins — by Phone Country Code" accent={PALETTE.teal}>
          <div style={{ padding: '1.25rem 0.75rem 1rem', height: Math.max(280, guestOriginsData.length * 48) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={guestOriginsData} layout="vertical" barCategoryGap="25%">
                <defs>
                  <linearGradient id="gradTeal" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={PALETTE.teal}  />
                    <stop offset="100%" stopColor="#52b2a8" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.border} horizontal={false} />
                <XAxis type="number" allowDecimals={false}
                  tick={{ fill: PALETTE.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" width={90}
                  tick={{ fill: PALETTE.ink, fontSize: 12, fontWeight: 500 }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    <DarkTooltip active={active} payload={payload} label={label}
                      formatter={v => `${v} guest${v !== 1 ? 's' : ''}`} />}
                  cursor={{ fill: 'rgba(42,157,143,0.06)' }}
                />
                <Bar dataKey="count" name="Guests" fill="url(#gradTeal)"
                  shape={<RoundedBar />} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Heatmap bubble grid */}
      {guestOriginsData.length > 0 && (
        <SectionCard icon={Flame} title="Guest Origins Heatmap — darker means more guests" accent={PALETTE.coral}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            {guestOriginsData.map(({ country, count }) => {
              const intensity = 0.22 + (count / maxCount) * 0.6;
              const lightText = intensity > 0.5;
              return (
                <div
                  key={country}
                  style={{
                    background: `rgba(231, 111, 81, ${intensity})`,
                    padding: '0.38rem 0.85rem',
                    borderRadius: 40,
                    fontWeight: 600,
                    color: lightText ? '#fff' : PALETTE.ink,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'transform 0.15s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <MapPin size={11} strokeWidth={2.5} />
                  {country}
                  <span style={{ fontWeight: 400, opacity: 0.8 }}>({count})</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
// src/components/common/StatsCard.js
import { fmt } from '../../utils/formatters';
import Icon from './Icon';

export default function StatsCard({ icon, value, label, variant = 'default', format = false, trend = null }) {
  const variantClass = variant === 'green' ? 'green' : variant === 'gold' ? 'gold' : '';
  const displayValue = format && typeof value === 'number' ? fmt(value) : value;

  // Find max for scaling the sparkline bars
  const maxTrend = trend && trend.length ? Math.max(...trend, 1) : 1;

  return (
    <div className={`stat-card ${variantClass}`}>
      <div className="stat-icon">
        <Icon name={icon} size={28} />
      </div>
      <div className="stat-value">{displayValue}</div>
      <div className="stat-label">{label}</div>
      
      {/* Sparkline (only if trend data provided) */}
      {trend && trend.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '30px' }}>
            {trend.map((val, idx) => (
              <div
                key={idx}
                style={{
                  width: '10px',
                  height: `${(val / maxTrend) * 28}px`,
                  backgroundColor: variant === 'green' ? '#10b981' : '#f97316',
                  borderRadius: '3px',
                  transition: 'height 0.2s'
                }}
                title={`Day ${idx+1}: ${fmt(val)}`}
              />
            ))}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Last 7 days
          </div>
        </div>
      )}
    </div>
  );
}
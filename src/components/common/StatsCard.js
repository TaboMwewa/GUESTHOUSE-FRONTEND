// src/components/common/StatsCard.js
import { fmt } from '../../utils/formatters';
import Icon from './Icon';

export default function StatsCard({ icon, value, label, variant = 'default', format = true }) {
  const variantClass = variant === 'green' ? 'green' : variant === 'gold' ? 'gold' : '';
  
  const displayValue = format && typeof value === 'number' ? fmt(value) : value;
  
  return (
    <div className={`stat-card ${variantClass}`}>
      <div className="stat-icon">
        <Icon name={icon} size={28} />
      </div>
      <div className="stat-value">{displayValue}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
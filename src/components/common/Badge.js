import { getBadgeConfig } from '../../utils/badges';

export default function Badge({ status, className = '' }) {
  const config = getBadgeConfig(status);
  return (
    <span className={`badge ${config.class} ${className}`}>
      {config.label}
    </span>
  );
}
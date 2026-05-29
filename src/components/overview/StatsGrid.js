import StatsCard from '../common/StatsCard';

export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatsCard 
          key={index}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
          variant={stat.variant}
          format={stat.format}
        />
      ))}
    </div>
  );
}
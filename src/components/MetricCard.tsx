interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  large?: boolean;
}

export default function MetricCard({ label, value, sub, accent = false, large = false }: MetricCardProps) {
  return (
    <div className={`metric-card ${accent ? 'metric-accent' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${large ? 'metric-large' : ''}`}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

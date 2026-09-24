/**
 * Small stat card with label, value, and optional description.
 */
export default function MetricCard({
  label,
  value,
  description,
  color,
  icon: Icon,
}) {
  return (
    <div className="metric-card" style={color ? { borderTopColor: color } : undefined}>
      <div className="metric-card-header">
        {Icon && <Icon size={18} className="metric-icon" />}
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value" style={color ? { color } : undefined}>
        {value}
      </div>
      {description && <p className="metric-desc">{description}</p>}
    </div>
  );
}

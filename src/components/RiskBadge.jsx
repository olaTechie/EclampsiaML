/**
 * Colored risk tier badge.
 */
export default function RiskBadge({ tier }) {
  if (!tier) return null;

  return (
    <span
      className="risk-badge"
      style={{
        backgroundColor: tier.bg,
        color: tier.color,
        border: `1.5px solid ${tier.color}`,
      }}
    >
      {tier.label}
    </span>
  );
}

/**
 * One page, one axis. Each field uses its own clock — consumption dates,
 * work years, event dates — and never compares across pages.
 */
export default function Field({
  points,
  from,
  to,
  count,
}: {
  points: number[];
  from: string;
  to: string;
  count?: string;
}) {
  return (
    <div className="field" aria-hidden="true">
      <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
        {points.map((x, index) => (
          <rect key={index} x={x * 992} y={12} width="2.4" height="16" />
        ))}
      </svg>
      <div className="field__scale">
        <span>{from}</span>
        {count && <span className="field__count">{count}</span>}
        <span>{to}</span>
      </div>
    </div>
  );
}

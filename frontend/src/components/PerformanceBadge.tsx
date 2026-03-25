interface Props {
  value: number | null;
  label?: string;
  size?: 'sm' | 'lg';
}

export function PerformanceBadge({ value, label, size = 'sm' }: Props) {
  if (value === null || value === undefined) {
    return (
      <div className="text-center">
        {label && (
          <div className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70 mb-1">
            {label}
          </div>
        )}
        <div className="text-sm text-cp-text-muted">N/A</div>
      </div>
    );
  }

  const pct = Math.round(value * 100);
  let color = 'text-red-500';
  if (pct >= 85) color = 'text-cp-dark';
  else if (pct >= 75) color = 'text-amber-600';
  else if (pct >= 60) color = 'text-orange-500';

  return (
    <div className="text-center">
      {label && (
        <div className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70 mb-1">
          {label}
        </div>
      )}
      <span className={`font-bold ${color} ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
        {pct}%
      </span>
    </div>
  );
}

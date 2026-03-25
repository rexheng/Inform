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
          <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-400 mb-1">
            {label}
          </div>
        )}
        <div className="text-sm text-gray-300">N/A</div>
      </div>
    );
  }

  const pct = Math.round(value * 100);
  let color = 'text-red-500';
  if (pct >= 85) color = 'text-[#4a8c7f]';
  else if (pct >= 75) color = 'text-amber-600';
  else if (pct >= 60) color = 'text-orange-500';

  return (
    <div className="text-center">
      {label && (
        <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-400 mb-1">
          {label}
        </div>
      )}
      <span className={`font-semibold ${color} ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
        {pct}%
      </span>
    </div>
  );
}

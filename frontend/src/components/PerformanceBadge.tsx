interface Props {
  value: number | null;
  label: string;
}

export function PerformanceBadge({ value, label }: Props) {
  if (value === null || value === undefined) {
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-sm text-gray-400">N/A</div>
      </div>
    );
  }

  const pct = Math.round(value * 100);
  let color = 'text-red-600 bg-red-50';
  if (pct >= 85) color = 'text-green-700 bg-green-50';
  else if (pct >= 75) color = 'text-yellow-700 bg-yellow-50';
  else if (pct >= 60) color = 'text-orange-700 bg-orange-50';

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${color}`}>
        {pct}%
      </span>
    </div>
  );
}

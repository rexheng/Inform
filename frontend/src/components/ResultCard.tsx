import { Link } from 'react-router-dom';
import type { SearchResult } from '../api/client';

interface Props {
  result: SearchResult;
  isFirst?: boolean;
}

function kmToMiles(km: number): string {
  return (km * 0.621371).toFixed(1);
}

function perfToAvgDays(performance: number | null, standard: number): string {
  if (performance === null || performance === undefined || performance === 0) return '—';
  // Estimate: avg days = standard * (1 - performance) + (standard * 0.5 * performance)
  // Simplified: if 80% within 62 days, weighted avg ~ 62 * (1 - 0.8*0.5) ≈ 37 days
  // Better heuristic: days = standard × (2 - performance) / 2
  const days = Math.round(standard * (2 - performance) / 2);
  return String(days);
}

export function ResultCard({ result, isFirst }: Props) {
  const avgDays = perfToAvgDays(result.performance_fds, 28);

  return (
    <Link
      to={`/provider/${result.ods_code}`}
      className={`block border-l-[3px] px-5 py-4 hover:bg-gray-50/80 transition-colors ${
        isFirst ? 'border-l-[#4a8c7f] bg-white' : 'border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] text-gray-900 leading-snug">
            {result.name}
          </h3>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Performance against 28-day standard
          </p>
        </div>
        <span className="text-[13px] text-gray-400 shrink-0 pt-0.5">
          {kmToMiles(result.distance_km)} mi
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400">
          Current Avg
        </span>
        <span className="flex-1 border-b border-dotted border-gray-200 mb-1" />
        <span className="text-[28px] font-semibold leading-none text-gray-800">
          {avgDays}
        </span>
        <span className="text-[13px] text-gray-400 mb-0.5">days</span>
      </div>
    </Link>
  );
}

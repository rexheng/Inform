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
  if (performance === null || performance === undefined || performance === 0) return '--';
  return String(Math.round(standard * (2 - performance) / 2));
}

function perfLabel(perf: number | null): { text: string; color: string } {
  if (perf === null || perf === undefined) return { text: 'No data', color: 'text-gray-400' };
  const pct = Math.round(perf * 100);
  if (pct >= 85) return { text: 'Good', color: 'text-[#4a8c7f]' };
  if (pct >= 75) return { text: 'OK', color: 'text-amber-600' };
  if (pct >= 60) return { text: 'Longer waits', color: 'text-orange-500' };
  return { text: 'Long waits', color: 'text-red-500' };
}

function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

export function ResultCard({ result, isFirst }: Props) {
  const avgDays = perfToAvgDays(result.performance_fds, 28);
  const rating = perfLabel(result.performance_fds);

  return (
    <div
      className={`border-l-[3px] px-5 py-4 transition-colors ${
        isFirst ? 'border-l-[#4a8c7f] bg-white' : 'border-l-transparent hover:bg-gray-50/80'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <Link to={`/provider/${result.ods_code}`} className="flex-1 min-w-0 group">
          <h3 className="font-semibold text-[15px] text-gray-900 leading-snug group-hover:text-[#4a8c7f] transition-colors">
            {result.name}
          </h3>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {kmToMiles(result.distance_km)} miles away
          </p>
        </Link>
        {isFirst && (
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider bg-[#4a8c7f]/10 text-[#4a8c7f] px-2 py-0.5 rounded">
            Best match
          </span>
        )}
      </div>

      {/* Wait time display */}
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400">
          Avg wait to diagnosis
        </span>
        <span className="flex-1 border-b border-dotted border-gray-200 mb-1" />
        <span className="text-[28px] font-semibold leading-none text-gray-800">
          {avgDays}
        </span>
        <span className="text-[13px] text-gray-400 mb-0.5">days</span>
      </div>

      {/* Rating + Actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[13px] font-medium ${rating.color}`}>
          {rating.text}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={directionsUrl(result.lat, result.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#4a8c7f] font-medium hover:underline flex items-center gap-1"
            onClick={e => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Directions
          </a>
          <Link
            to={`/provider/${result.ods_code}`}
            className="text-[12px] text-gray-400 font-medium hover:text-gray-600"
          >
            Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

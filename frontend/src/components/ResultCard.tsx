import { Link } from 'react-router-dom';
import { SearchResult } from '../api/client';
import { PerformanceBadge } from './PerformanceBadge';

interface Props {
  result: SearchResult;
}

export function ResultCard({ result }: Props) {
  return (
    <Link
      to={`/provider/${result.ods_code}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">
              {result.rank}
            </span>
            <h3 className="font-semibold text-gray-900 truncate">{result.name}</h3>
          </div>
          <p className="text-sm text-gray-500 ml-9">
            {result.distance_km} km away
            {result.total_patients_62d > 0 && (
              <span> &middot; {result.total_patients_62d} patients (62-day pathway)</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4 ml-9">
        <PerformanceBadge value={result.performance_fds} label="28-Day" />
        <PerformanceBadge value={result.performance_31d} label="31-Day" />
        <PerformanceBadge value={result.performance_62d} label="62-Day" />
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-500 mb-1">Match Score</div>
          <span className="text-sm font-mono text-gray-700">{result.score.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}

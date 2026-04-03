'use client';
import Link from 'next/link';
import type { SearchResult } from '../types';

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
  if (perf === null || perf === undefined) return { text: 'No data', color: 'text-cp-text-muted' };
  const pct = Math.round(perf * 100);
  if (pct >= 85) return { text: 'Good', color: 'text-cp-dark' };
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
    <div className={`border-l-[3px] px-5 py-4 transition-all duration-100 ${isFirst ? 'border-l-cp-dark bg-cp-surface' : 'border-l-transparent hover:bg-cp-bg'}`}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/map/trust/${result.ods_code}`} className="flex-1 min-w-0 group">
          <h3 className="font-semibold text-[15px] text-cp-dark leading-snug group-hover:opacity-70 transition-colors">{result.name}</h3>
          <p className="text-[13px] text-cp-text-muted mt-0.5 font-medium">{kmToMiles(result.distance_km)} miles away</p>
        </Link>
        {isFirst && (<span className="shrink-0 text-[0.7rem] font-bold uppercase tracking-[0.05em] bg-cp-lime text-cp-dark px-2.5 py-1 rounded-full">Best match</span>)}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70">Avg wait to diagnosis</span>
        <span className="flex-1 border-b border-dotted border-cp-border mb-1" />
        <span className="text-[28px] font-extrabold leading-none text-cp-dark tracking-[-0.03em]">{avgDays}</span>
        <span className="text-[13px] text-cp-text-muted mb-0.5 font-medium">days</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[13px] font-semibold ${rating.color}`}>{rating.text}</span>
        <div className="flex items-center gap-3">
          <a href={directionsUrl(result.lat, result.lng)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-cp-dark font-semibold hover:opacity-70 flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            Directions
          </a>
          <Link href={`/map/trust/${result.ods_code}`} className="text-[12px] text-cp-text-muted font-medium hover:text-cp-dark">Details &rarr;</Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { getAllTrusts } from '@/lib/nhs';
import { ChatWidget } from '@/map/components/ChatWidget';
import type { Condition } from '@/lib/types';
import { CONDITIONS } from '@/lib/types';

const TrustMap = dynamic(() => import('@/map/components/ResultsMap').then(m => ({ default: m.TrustMap })), { ssr: false });

export default function MapPage() {
  const [condition, setCondition] = useState<Condition>('breast');
  const trusts = useMemo(() => getAllTrusts(), []);

  const stats = useMemo(() => {
    const waits = trusts.map(t => t.waits[condition]);
    const avg = waits.reduce((a, b) => a + b, 0) / waits.length;
    const min = Math.min(...waits);
    const max = Math.max(...waits);
    return { avg: Math.round(avg), min, max, total: trusts.length };
  }, [trusts, condition]);

  const avgDays = stats.avg * 7;

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 bg-cp-surface border-b border-cp-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="px-3 py-1 rounded-full bg-cp-lime text-cp-dark text-xs font-bold">ClearPath</a>
            <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-text-muted opacity-70">London Cancer Wait Times</span>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="cancer-select" className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-dark opacity-70">Cancer type</label>
            <select
              id="cancer-select"
              value={condition}
              onChange={e => setCondition(e.target.value as Condition)}
              className="rounded-full border-[1.5px] border-cp-border bg-white px-4 py-2 text-cp-dark text-[14px] font-semibold focus:border-cp-dark focus:outline-none appearance-none cursor-pointer pr-8"
            >
              {CONDITIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-6 pb-4 flex items-stretch gap-3">
          <div className="flex-1 bg-white rounded-[20px] border-[1.5px] border-cp-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cp-purple/20 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0A4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-text-muted opacity-70">NHS Target</p>
              <p className="text-[2rem] font-extrabold text-cp-dark tracking-[-0.04em] leading-none mt-0.5">28<span className="text-[0.9rem] font-bold ml-1 tracking-normal">days</span></p>
              <p className="text-[11px] text-cp-text-muted mt-0.5">Faster Diagnosis Standard</p>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[20px] border-[1.5px] border-cp-border p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${avgDays > 28 ? 'bg-red-100' : 'bg-green-100'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={avgDays > 28 ? '#ef4444' : '#0A3B2A'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-text-muted opacity-70">London Avg ({CONDITIONS.find(c => c.value === condition)?.label})</p>
              <p className={`text-[2rem] font-extrabold tracking-[-0.04em] leading-none mt-0.5 ${avgDays > 28 ? 'text-red-500' : 'text-cp-dark'}`}>
                {avgDays}<span className="text-[0.9rem] font-bold ml-1 tracking-normal">days</span>
              </p>
              <p className="text-[11px] text-cp-text-muted mt-0.5">Avg across {stats.total} trusts</p>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[20px] border-[1.5px] border-cp-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cp-mint/30 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A3B2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-text-muted opacity-70">Wait Range</p>
              <p className="text-[2rem] font-extrabold text-cp-dark tracking-[-0.04em] leading-none mt-0.5">
                {stats.min * 7}<span className="text-[0.9rem] font-bold tracking-normal">–</span>{stats.max * 7}<span className="text-[0.9rem] font-bold ml-1 tracking-normal">days</span>
              </p>
              <p className="text-[11px] text-cp-text-muted mt-0.5">Fastest to slowest trust</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative isolate">
        <TrustMap trusts={trusts} condition={condition} />
        <ChatWidget context={{ cancer_type: condition, results: trusts.sort((a, b) => a.waits[condition] - b.waits[condition]).slice(0, 10).map(t => ({ name: t.name, borough: t.borough, wait_weeks: t.waits[condition], wait_days: t.waits[condition] * 7, meets_28day: t.target_met['28day'], meets_62day: t.target_met['62day'] })) as unknown as Record<string, unknown>[] }} />
      </div>
    </div>
  );
}

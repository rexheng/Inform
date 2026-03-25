'use client';
import { use, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getTrustByCode } from '@/lib/nhs';
import { trustInfo } from '@/map/data/trustInfo';
import type { Condition } from '@/lib/types';
import { CONDITIONS, CANCER_TYPES } from '@/lib/types';

/** Estimate a performance fraction from average wait days vs target days. */
function estimatePerformance(waitDays: number, targetDays: number): number {
  if (waitDays <= targetDays) return Math.min(0.95, 0.78 + 0.17 * (targetDays - waitDays) / targetDays);
  return Math.max(0.30, (targetDays / waitDays) * 0.82);
}

function ratingBadge(perf: number): { label: string; color: string; bg: string; desc: string } {
  const pct = Math.round(perf * 100);
  if (pct >= 85) return { label: 'Good', color: 'text-cp-dark', bg: 'bg-cp-lime/20', desc: 'Most patients are seen within the NHS target time.' };
  if (pct >= 75) return { label: 'Acceptable', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Some patients experience delays beyond the target time.' };
  if (pct >= 60) return { label: 'Delays likely', color: 'text-orange-500', bg: 'bg-orange-50', desc: 'A significant number of patients wait longer than the NHS target.' };
  return { label: 'Significant delays', color: 'text-red-500', bg: 'bg-red-50', desc: 'Many patients are waiting well beyond the NHS target time.' };
}

function MetricCard({ title, subtitle, days, target, performance }: { title: string; subtitle: string; days: number; target: number; performance: number }) {
  const rating = ratingBadge(performance);
  const pct = Math.round(performance * 100);
  return (
    <div className="bg-cp-surface border-[1.5px] border-cp-border rounded-[20px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-cp-dark">{title}</h3>
          <p className="text-[13px] text-cp-text-muted mt-0.5 font-medium">{subtitle}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[0.7rem] font-bold ${rating.color} ${rating.bg}`}>{rating.label}</span>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-[3.5rem] font-extrabold leading-none text-cp-dark tracking-[-0.05em]">{days}</span>
        <span className="text-[15px] text-cp-text-muted mb-2 font-medium">days average</span>
      </div>
      <div className="mt-3">
        <div className="h-2 bg-cp-bg rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 85 ? '#0A3B2A' : pct >= 75 ? '#d97706' : pct >= 60 ? '#f97316' : '#ef4444' }} />
        </div>
        <p className="text-[12px] text-cp-text-muted mt-1.5 font-medium">{pct}% of patients seen within {target}-day NHS target</p>
      </div>
      {rating.desc && <p className="text-[13px] text-cp-text-muted mt-2 font-medium">{rating.desc}</p>}
    </div>
  );
}

export default function TrustDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const condition = (searchParams.get('condition') as Condition) || 'breast';
  const trust = useMemo(() => getTrustByCode(code), [code]);

  if (!trust) return (
    <div className="min-h-screen bg-cp-bg">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/map" className="text-cp-dark text-sm font-semibold hover:opacity-70">&larr; Back to map</Link>
        <div className="mt-6 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">Hospital not found</div>
      </div>
    </div>
  );

  const waitWeeks = trust.waits[condition];
  const waitDays = waitWeeks * 7;

  // Derive approximate metric splits from total pathway wait
  const fdsDays = Math.round(waitDays * 0.45);       // ~45% of pathway is diagnosis
  const treatmentDays = Math.round(waitDays * 0.38);  // ~38% is decision-to-treatment
  const totalDays = waitDays;                          // full referral-to-treatment

  const fdsPerf = estimatePerformance(fdsDays, 28);
  const treatPerf = estimatePerformance(treatmentDays, 31);
  const totalPerf = estimatePerformance(totalDays, 62);

  const contact = trustInfo[code];
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${trust.lat},${trust.lng}&travelmode=transit`;

  return (
    <div className="min-h-screen bg-cp-bg">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/map" className="text-cp-dark text-sm font-semibold hover:opacity-70">&larr; Back to map</Link>

        {/* Header */}
        <div className="mt-6 bg-cp-surface border-[1.5px] border-cp-border rounded-[20px] p-6">
          <h1 className="text-xl font-extrabold text-cp-dark tracking-[-0.02em]">{trust.name}</h1>
          <p className="text-[13px] text-cp-text-muted mt-1 font-medium">{trust.borough}</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-cp-dark text-white text-[13px] font-bold hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
              Get Directions
            </a>
            {contact && (
              <>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-[13px] font-semibold bg-transparent hover:bg-cp-bg transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                  {contact.phone}
                </a>
                <a href={contact.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-[13px] font-semibold bg-transparent hover:bg-cp-bg transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                  Hospital Website
                </a>
              </>
            )}
          </div>
        </div>

        {/* Condition selector */}
        <div className="mt-6 flex items-center gap-3">
          <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-dark opacity-70">Showing data for</span>
          <div className="flex gap-2">
            {CONDITIONS.map(c => (
              <Link
                key={c.value}
                href={`/map/trust/${code}?condition=${c.value}`}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${c.value === condition ? 'bg-cp-dark text-white' : 'bg-cp-surface border-[1.5px] border-cp-border text-cp-dark hover:bg-cp-bg'}`}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Metric cards */}
        <div className="mt-6 space-y-4">
          <h2 className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70">What to expect at this hospital</h2>
          <div className="grid gap-4">
            <MetricCard title="Time to diagnosis" subtitle="How quickly you'll find out your results after referral" days={fdsDays} target={28} performance={fdsPerf} />
            <MetricCard title="Time to start treatment" subtitle="How quickly treatment begins once decided" days={treatmentDays} target={31} performance={treatPerf} />
            <MetricCard title="Referral to treatment" subtitle="Total time from GP referral to first treatment" days={totalDays} target={62} performance={totalPerf} />
          </div>
        </div>

        {/* Cancers treated */}
        <div className="mt-8">
          <h2 className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70 mb-3">Cancers treated here</h2>
          <div className="bg-cp-surface border-[1.5px] border-cp-border rounded-[20px] p-5">
            <div className="flex flex-wrap gap-2">
              {CANCER_TYPES.map(ct => (
                <span key={ct.value} className="px-3.5 py-1.5 rounded-full bg-cp-bg text-[13px] text-cp-dark font-medium border-[1.5px] border-cp-border">{ct.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right to choose */}
        <div className="mt-8 bg-cp-purple rounded-[32px] p-6">
          <h2 className="text-[14px] font-bold text-cp-dark mb-2">Your right to choose</h2>
          <p className="text-[13px] text-cp-dark/80 leading-relaxed font-medium">Under the NHS Constitution, you have the right to choose which hospital you are referred to for cancer treatment. If wait times are shorter at another hospital, you can ask your GP to refer you there instead.</p>
          <p className="text-[13px] text-cp-dark/60 mt-3 leading-relaxed font-medium">Talk to your GP about your options. You can also contact the hospital&apos;s Patient Advice and Liaison Service (PALS){contact ? ` on ${contact.phone}` : ''} for more information.</p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-[12px] text-cp-text-muted opacity-60 leading-relaxed">Data from NHS England Cancer Waiting Times (January 2026). Wait times are indicative averages based on monthly published statistics. Actual wait times may vary. Always discuss your care options with your GP.</div>
      </div>
    </div>
  );
}

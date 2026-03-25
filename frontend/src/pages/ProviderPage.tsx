import { useParams, Link } from 'react-router-dom';
import { useProvider } from '../hooks/useProvider';
import { trustInfo } from '../data/trustInfo';

function perfToAvgDays(perf: number, std: number): number {
  return Math.round(std * (2 - perf) / 2);
}

function ratingBadge(perf: number | undefined): { label: string; color: string; bg: string; desc: string } {
  if (perf === undefined) return { label: 'No data', color: 'text-cp-text-muted', bg: 'bg-cp-bg', desc: '' };
  const pct = Math.round(perf * 100);
  if (pct >= 85) return { label: 'Good', color: 'text-cp-dark', bg: 'bg-cp-lime/20', desc: 'Most patients are seen within the NHS target time.' };
  if (pct >= 75) return { label: 'Acceptable', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Some patients experience delays beyond the target time.' };
  if (pct >= 60) return { label: 'Delays likely', color: 'text-orange-500', bg: 'bg-orange-50', desc: 'A significant number of patients wait longer than the NHS target.' };
  return { label: 'Significant delays', color: 'text-red-500', bg: 'bg-red-50', desc: 'Many patients are waiting well beyond the NHS target time.' };
}

function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

export function ProviderPage() {
  const { odsCode } = useParams<{ odsCode: string }>();
  const { provider, loading, error } = useProvider(odsCode);

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg flex items-center justify-center">
        <span className="text-cp-text-muted text-sm font-medium">Loading...</span>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-cp-bg">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link to="/" className="text-cp-dark text-sm font-semibold hover:opacity-70">&larr; Back to search</Link>
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
            {error || 'Hospital not found'}
          </div>
        </div>
      </div>
    );
  }

  const monthOrder: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };
  const periodKey = (p: string) => {
    const [month, year] = p.split(' ');
    return (parseInt(year) || 0) * 100 + (monthOrder[month] || 0);
  };
  const periods = Object.keys(provider.wait_times).sort((a, b) => periodKey(b) - periodKey(a));
  const latestPeriod = periods[0];
  const latestData = latestPeriod ? provider.wait_times[latestPeriod] : null;

  const fdsEntries = latestData?.FDS || [];
  const entries31d = latestData?.['31D'] || [];
  const entries62d = latestData?.['62D'] || [];

  const fdsPerfs = fdsEntries.filter(e => e.performance > 0).map(e => e.performance);
  const avgFds = fdsPerfs.length > 0 ? fdsPerfs.reduce((a, b) => a + b, 0) / fdsPerfs.length : undefined;

  const perfs31d = entries31d.filter(e => e.performance > 0).map(e => e.performance);
  const avg31d = perfs31d.length > 0 ? perfs31d.reduce((a, b) => a + b, 0) / perfs31d.length : undefined;

  const perfs62d = entries62d.filter(e => e.performance > 0).map(e => e.performance);
  const avg62d = perfs62d.length > 0 ? perfs62d.reduce((a, b) => a + b, 0) / perfs62d.length : undefined;

  const contact = trustInfo[provider.ods_code];

  return (
    <div className="min-h-screen bg-cp-bg">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/" className="text-cp-dark text-sm font-semibold hover:opacity-70">&larr; Back to search</Link>

        {/* Hospital header */}
        <div className="mt-6 bg-cp-surface border-[1.5px] border-cp-border rounded-[20px] p-6">
          <h1 className="text-xl font-extrabold text-cp-dark tracking-[-0.02em]">{provider.name}</h1>
          <p className="text-[13px] text-cp-text-muted mt-1 font-medium">{provider.postcode}</p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href={directionsUrl(provider.latitude, provider.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-cp-dark text-white text-[13px] font-bold hover:opacity-90 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Get Directions
            </a>
            {contact && (
              <>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-[13px] font-semibold bg-transparent hover:bg-cp-bg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {contact.phone}
                </a>
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-[1.5px] border-cp-dark text-cp-dark text-[13px] font-semibold bg-transparent hover:bg-cp-bg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                  Hospital Website
                </a>
              </>
            )}
          </div>
        </div>

        {/* Wait time summary */}
        {latestData && (
          <div className="mt-6 space-y-4">
            <h2 className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70">
              What to expect at this hospital
            </h2>

            <div className="grid gap-4">
              {avgFds !== undefined && (
                <MetricCard
                  title="Time to diagnosis"
                  subtitle="How quickly you'll find out your results after referral"
                  days={perfToAvgDays(avgFds, 28)}
                  target={28}
                  performance={avgFds}
                />
              )}

              {avg31d !== undefined && (
                <MetricCard
                  title="Time to start treatment"
                  subtitle="How quickly treatment begins once decided"
                  days={perfToAvgDays(avg31d, 31)}
                  target={31}
                  performance={avg31d}
                />
              )}

              {avg62d !== undefined && (
                <MetricCard
                  title="Referral to treatment"
                  subtitle="Total time from GP referral to first treatment"
                  days={perfToAvgDays(avg62d, 62)}
                  target={62}
                  performance={avg62d}
                />
              )}
            </div>
          </div>
        )}

        {/* Cancer types treated */}
        {fdsEntries.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70 mb-3">
              Cancers treated here
            </h2>
            <div className="bg-cp-surface border-[1.5px] border-cp-border rounded-[20px] p-5">
              <div className="flex flex-wrap gap-2">
                {fdsEntries.map(e => (
                  <span
                    key={e.cancer_type}
                    className="px-3.5 py-1.5 rounded-full bg-cp-bg text-[13px] text-cp-dark font-medium border-[1.5px] border-cp-border"
                  >
                    {e.display_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Your rights — edu/rights card uses cp-purple */}
        <div className="mt-8 bg-cp-purple rounded-[32px] p-6">
          <h2 className="text-[14px] font-bold text-cp-dark mb-2">
            Your right to choose
          </h2>
          <p className="text-[13px] text-cp-dark/80 leading-relaxed font-medium">
            Under the NHS Constitution, you have the right to choose which hospital you are referred to for cancer treatment.
            If wait times are shorter at another hospital, you can ask your GP to refer you there instead.
          </p>
          <p className="text-[13px] text-cp-dark/60 mt-3 leading-relaxed font-medium">
            Talk to your GP about your options. You can also contact the hospital's Patient Advice and Liaison Service (PALS)
            {contact ? ` on ${contact.phone}` : ''} for more information.
          </p>
        </div>

        {/* Data disclaimer */}
        <div className="mt-6 text-[12px] text-cp-text-muted opacity-60 leading-relaxed">
          Data from NHS England Cancer Waiting Times ({latestPeriod}).
          Wait times are indicative averages based on monthly published statistics.
          Actual wait times may vary. Always discuss your care options with your GP.
        </div>
      </div>
    </div>
  );
}

/** A single patient-friendly metric card. */
function MetricCard({ title, subtitle, days, target, performance }: {
  title: string;
  subtitle: string;
  days: number;
  target: number;
  performance: number;
}) {
  const rating = ratingBadge(performance);
  const pct = Math.round(performance * 100);

  return (
    <div className="bg-cp-surface border-[1.5px] border-cp-border rounded-[20px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-cp-dark">{title}</h3>
          <p className="text-[13px] text-cp-text-muted mt-0.5 font-medium">{subtitle}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[0.7rem] font-bold ${rating.color} ${rating.bg}`}>
          {rating.label}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-[3.5rem] font-extrabold leading-none text-cp-dark tracking-[-0.05em]">{days}</span>
        <span className="text-[15px] text-cp-text-muted mb-2 font-medium">days average</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-cp-bg rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: pct >= 85 ? '#0A3B2A' : pct >= 75 ? '#d97706' : pct >= 60 ? '#f97316' : '#ef4444',
            }}
          />
        </div>
        <p className="text-[12px] text-cp-text-muted mt-1.5 font-medium">
          {pct}% of patients seen within {target}-day NHS target
        </p>
      </div>

      {rating.desc && (
        <p className="text-[13px] text-cp-text-muted mt-2 font-medium">{rating.desc}</p>
      )}
    </div>
  );
}

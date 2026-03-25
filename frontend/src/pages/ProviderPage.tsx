import { useParams, Link } from 'react-router-dom';
import { useProvider } from '../hooks/useProvider';
import { trustInfo } from '../data/trustInfo';

function perfToAvgDays(perf: number, std: number): number {
  return Math.round(std * (2 - perf) / 2);
}

function ratingBadge(perf: number | undefined): { label: string; color: string; bg: string; desc: string } {
  if (perf === undefined) return { label: 'No data', color: 'text-gray-400', bg: 'bg-gray-50', desc: '' };
  const pct = Math.round(perf * 100);
  if (pct >= 85) return { label: 'Good', color: 'text-[#4a8c7f]', bg: 'bg-[#4a8c7f]/10', desc: 'Most patients are seen within the NHS target time.' };
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
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link to="/" className="text-[#4a8c7f] text-sm hover:underline">&larr; Back to search</Link>
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
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

  // Get key metrics — pick a representative FDS entry or overall
  const fdsEntries = latestData?.FDS || [];
  const entries31d = latestData?.['31D'] || [];
  const entries62d = latestData?.['62D'] || [];

  // Average FDS performance across all cancer types
  const fdsPerfs = fdsEntries.filter(e => e.performance > 0).map(e => e.performance);
  const avgFds = fdsPerfs.length > 0 ? fdsPerfs.reduce((a, b) => a + b, 0) / fdsPerfs.length : undefined;

  const perfs31d = entries31d.filter(e => e.performance > 0).map(e => e.performance);
  const avg31d = perfs31d.length > 0 ? perfs31d.reduce((a, b) => a + b, 0) / perfs31d.length : undefined;

  const perfs62d = entries62d.filter(e => e.performance > 0).map(e => e.performance);
  const avg62d = perfs62d.length > 0 ? perfs62d.reduce((a, b) => a + b, 0) / perfs62d.length : undefined;

  const contact = trustInfo[provider.ods_code];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/" className="text-[#4a8c7f] text-sm hover:underline">&larr; Back to search</Link>

        {/* Hospital header */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <h1 className="text-xl font-bold text-gray-900">{provider.name}</h1>
          <p className="text-[13px] text-gray-400 mt-1">{provider.postcode}</p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href={directionsUrl(provider.latitude, provider.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4a8c7f] text-white text-[13px] font-semibold hover:bg-[#3d7568] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Get Directions
            </a>
            {contact && (
              <>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  {contact.phone}
                </a>
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                  Hospital Website
                </a>
              </>
            )}
          </div>
        </div>

        {/* Wait time summary — patient-friendly */}
        {latestData && (
          <div className="mt-6 space-y-4">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400">
              What to expect at this hospital
            </h2>

            {/* Three key metrics as cards */}
            <div className="grid gap-4">
              {/* Diagnosis speed */}
              {avgFds !== undefined && (
                <MetricCard
                  title="Time to diagnosis"
                  subtitle="How quickly you'll find out your results after referral"
                  days={perfToAvgDays(avgFds, 28)}
                  target={28}
                  performance={avgFds}
                />
              )}

              {/* Treatment start */}
              {avg31d !== undefined && (
                <MetricCard
                  title="Time to start treatment"
                  subtitle="How quickly treatment begins once decided"
                  days={perfToAvgDays(avg31d, 31)}
                  target={31}
                  performance={avg31d}
                />
              )}

              {/* End to end */}
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
            <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-3">
              Cancers treated here
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex flex-wrap gap-2">
                {fdsEntries.map(e => (
                  <span
                    key={e.cancer_type}
                    className="px-3 py-1.5 rounded-full bg-gray-50 text-[13px] text-gray-600 border border-gray-100"
                  >
                    {e.display_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Your rights */}
        <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-2">
            Your right to choose
          </h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Under the NHS Constitution, you have the right to choose which hospital you are referred to for cancer treatment.
            If wait times are shorter at another hospital, you can ask your GP to refer you there instead.
          </p>
          <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">
            Talk to your GP about your options. You can also contact the hospital's Patient Advice and Liaison Service (PALS)
            {contact ? ` on ${contact.phone}` : ''} for more information.
          </p>
        </div>

        {/* Data disclaimer */}
        <div className="mt-6 text-[12px] text-gray-300 leading-relaxed">
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
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-md text-[12px] font-semibold ${rating.color} ${rating.bg}`}>
          {rating.label}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-[36px] font-bold leading-none text-gray-800">{days}</span>
        <span className="text-[15px] text-gray-400 mb-1">days average</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: pct >= 85 ? '#4a8c7f' : pct >= 75 ? '#d97706' : pct >= 60 ? '#f97316' : '#ef4444',
            }}
          />
        </div>
        <p className="text-[12px] text-gray-400 mt-1.5">
          {pct}% of patients seen within {target}-day NHS target
        </p>
      </div>

      {rating.desc && (
        <p className="text-[13px] text-gray-500 mt-2">{rating.desc}</p>
      )}
    </div>
  );
}

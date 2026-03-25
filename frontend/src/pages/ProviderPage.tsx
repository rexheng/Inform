import { useParams, Link } from 'react-router-dom';
import { useProvider } from '../hooks/useProvider';

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
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link to="/" className="text-[#4a8c7f] text-sm hover:underline">&larr; Back to search</Link>
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
            {error || 'Provider not found'}
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

  const standardLabels: Record<string, string> = {
    '62D': '62-Day Standard',
    '31D': '31-Day Standard',
    'FDS': '28-Day Faster Diagnosis',
  };

  function perfColor(perf: number): string {
    const pct = Math.round(perf * 100);
    if (pct >= 85) return 'text-[#4a8c7f]';
    if (pct >= 75) return 'text-amber-600';
    if (pct >= 60) return 'text-orange-500';
    return 'text-red-500';
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Nav */}
        <Link to="/" className="text-[#4a8c7f] text-sm hover:underline">&larr; Back to search</Link>

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {provider.postcode} &middot; ODS: {provider.ods_code}
          </p>
          {latestPeriod && (
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-300 mt-3">
              Latest data: {latestPeriod}
            </p>
          )}
        </div>

        {/* Standards */}
        {latestData && (
          <div className="space-y-8">
            {(['FDS', '31D', '62D'] as const).map(standard => {
              const entries = latestData[standard];
              if (!entries || entries.length === 0) return null;

              return (
                <div key={standard}>
                  <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-4">
                    {standardLabels[standard]}
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-400 border-b border-gray-100">
                          <th className="px-5 py-3">Cancer Type</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">Within</th>
                          <th className="px-5 py-3 text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {entries.map(entry => (
                          <tr key={entry.cancer_type} className="hover:bg-gray-50/50">
                            <td className="px-5 py-3 text-gray-800">{entry.display_name}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{entry.total_patients}</td>
                            <td className="px-4 py-3 text-right text-gray-500">{entry.within_standard}</td>
                            <td className={`px-5 py-3 text-right font-semibold ${perfColor(entry.performance)}`}>
                              {Math.round(entry.performance * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Historical data */}
        {periods.length > 1 && (
          <div className="mt-10">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-3">
              Available Periods
            </h2>
            <div className="flex flex-wrap gap-2">
              {periods.map(period => (
                <span
                  key={period}
                  className={`px-3 py-1 rounded text-[13px] ${
                    period === latestPeriod
                      ? 'bg-[#4a8c7f]/10 text-[#4a8c7f] font-medium'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {period}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

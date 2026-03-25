import { useParams, Link } from 'react-router-dom';
import { useProvider } from '../hooks/useProvider';
import { PerformanceBadge } from '../components/PerformanceBadge';

export function ProviderPage() {
  const { odsCode } = useParams<{ odsCode: string }>();
  const { provider, loading, error } = useProvider(odsCode);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading provider details...</div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Back to search</Link>
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error || 'Provider not found'}
          </div>
        </div>
      </div>
    );
  }

  const periods = Object.keys(provider.wait_times).sort().reverse();
  const latestPeriod = periods[0];
  const latestData = latestPeriod ? provider.wait_times[latestPeriod] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Back to search</Link>

        {/* Header */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
          <p className="text-gray-500 mt-1">
            {provider.postcode} &middot; ODS Code: {provider.ods_code}
          </p>
          {latestPeriod && (
            <p className="text-sm text-gray-400 mt-2">Latest data: {latestPeriod}</p>
          )}
        </div>

        {/* Wait time tables by standard */}
        {latestData && (
          <div className="mt-6 space-y-6">
            {(['62D', '31D', 'FDS'] as const).map(standard => {
              const entries = latestData[standard];
              if (!entries || entries.length === 0) return null;

              const labels: Record<string, string> = {
                '62D': '62-Day Standard (Referral to Treatment)',
                '31D': '31-Day Standard (Decision to Treatment)',
                'FDS': '28-Day Faster Diagnosis Standard',
              };

              return (
                <div key={standard} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">{labels[standard]}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500">
                          <th className="px-6 py-3 font-medium">Cancer Type</th>
                          <th className="px-4 py-3 font-medium text-right">Total</th>
                          <th className="px-4 py-3 font-medium text-right">Within</th>
                          <th className="px-4 py-3 font-medium text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entries.map(entry => (
                          <tr key={entry.cancer_type} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-gray-900">{entry.display_name}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{entry.total_patients}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{entry.within_standard}</td>
                            <td className="px-4 py-3 text-right">
                              <PerformanceBadge value={entry.performance} label="" />
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

        {/* Historical periods */}
        {periods.length > 1 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Historical Data</h2>
            <div className="flex flex-wrap gap-2">
              {periods.map(period => (
                <span
                  key={period}
                  className={`px-3 py-1 rounded-full text-sm ${
                    period === latestPeriod
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600'
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

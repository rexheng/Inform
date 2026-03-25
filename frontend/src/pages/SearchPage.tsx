import { useNavigate } from 'react-router-dom';
import { SearchForm } from '../components/SearchForm';
import { ResultCard } from '../components/ResultCard';
import { useSearch } from '../hooks/useSearch';

export function SearchPage() {
  const navigate = useNavigate();
  const { data, loading, error, search } = useSearch();

  const handleSearch = (cancerType: string, postcode: string) => {
    search(cancerType, postcode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Inform</h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Compare NHS cancer waiting times across London hospitals.
            Find the fastest treatment option near you.
          </p>
        </div>
      </header>

      {/* Search */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {data && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {data.results.length} providers found
              </h2>
              <span className="text-sm text-gray-500">
                Data: {data.period}
              </span>
            </div>

            {data.results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No providers found for this cancer type. Try a different search.
              </p>
            ) : (
              <div className="space-y-3">
                {data.results.map(result => (
                  <ResultCard key={result.ods_code} result={result} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info section */}
        {!data && !loading && (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl mb-2">&#x1F4CA;</div>
              <h3 className="font-semibold text-gray-900 mb-1">Real NHS Data</h3>
              <p className="text-sm text-gray-600">
                Based on official NHS England Cancer Waiting Times statistics, updated monthly.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl mb-2">&#x1F4CD;</div>
              <h3 className="font-semibold text-gray-900 mb-1">Distance-Aware</h3>
              <p className="text-sm text-gray-600">
                Results ranked by a combination of wait time performance and distance from your postcode.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-2xl mb-2">&#x1F3E5;</div>
              <h3 className="font-semibold text-gray-900 mb-1">23 London Trusts</h3>
              <p className="text-sm text-gray-600">
                Covering all NHS cancer treatment providers across Greater London.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

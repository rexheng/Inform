import { useState, useMemo } from 'react';
import { SearchForm } from '../components/SearchForm';
import { ResultCard } from '../components/ResultCard';
import { ResultsMap } from '../components/ResultsMap';
import { ChatWidget } from '../components/ChatWidget';
import { useSearch } from '../hooks/useSearch';
import type { SearchParams } from '../api/client';
import type { ChatSearchContext } from '../hooks/useChat';

export function SearchPage() {
  const { data, loading, error, search } = useSearch();
  const [hoveredOds, setHoveredOds] = useState<string | undefined>();

  const chatContext = useMemo<ChatSearchContext | undefined>(() => {
    if (!data) return undefined;
    return {
      cancer_type: data.cancer_type,
      postcode: data.postcode,
      results: data.results.slice(0, 10) as unknown as Record<string, unknown>[],
    };
  }, [data]);

  const handleSearch = (params: SearchParams) => {
    search(params);
  };

  return (
    <div className="h-screen flex">
      {/* Left panel */}
      <div className="w-[420px] shrink-0 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4a8c7f]" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900 uppercase">
              Inform
            </h1>
          </div>
          <h2 className="text-[22px] text-gray-500 font-light leading-snug">
            Find care faster.
          </h2>
          <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed">
            Compare NHS cancer wait times and distances instantly based on public data.
          </p>
        </div>

        {/* Search form */}
        <div className="px-6 pb-6">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded text-red-600 text-[13px]">
            {error}
          </div>
        )}

        {/* Results header */}
        {data && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[13px] text-gray-400">
              {data.results.length} hospitals found nearby
            </span>
            <span className="text-[13px] text-gray-500 font-medium">
              Best match &#8595;
            </span>
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto border-t border-gray-100">
          {data && data.results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.results.map((result, i) => (
                <div
                  key={result.ods_code}
                  onMouseEnter={() => setHoveredOds(result.ods_code)}
                  onMouseLeave={() => setHoveredOds(undefined)}
                >
                  <ResultCard result={result} isFirst={i === 0} />
                </div>
              ))}
            </div>
          ) : data ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No hospitals found for this cancer type in your area.
            </div>
          ) : !loading ? (
            <div className="px-6 py-12 text-center text-gray-300 text-sm">
              Select a condition and location to see results
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 text-[11px] text-gray-300">
          Source: NHS England Cancer Waiting Times {data?.period || ''} &middot; Indicative only
        </div>
      </div>

      {/* Right panel — Map */}
      <div className="flex-1 bg-gray-100 relative">
        <ResultsMap
          results={data?.results || []}
          userLocation={data?.user_location}
          highlightOds={hoveredOds}
        />
        <ChatWidget context={chatContext} />
      </div>
    </div>
  );
}

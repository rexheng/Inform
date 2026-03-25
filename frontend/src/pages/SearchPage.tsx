import { useState } from 'react';
import { SearchForm } from '../components/SearchForm';
import { ResultCard } from '../components/ResultCard';
import { ResultsMap } from '../components/ResultsMap';
import { useSearch } from '../hooks/useSearch';
import type { SearchParams } from '../api/client';

export function SearchPage() {
  const { data, loading, error, search } = useSearch();
  const [hoveredOds, setHoveredOds] = useState<string | undefined>();

  const handleSearch = (params: SearchParams) => {
    search(params);
  };

  return (
    <div className="h-screen flex">
      {/* Left panel */}
      <div className="w-[420px] shrink-0 border-r border-cp-border bg-cp-surface flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-cp-lime text-cp-dark text-xs font-bold">
              ClearPath
            </span>
          </div>
          <h2 className="text-[22px] text-cp-dark font-extrabold leading-snug tracking-[-0.02em]">
            Find care faster.
          </h2>
          <p className="text-[13px] text-cp-text-muted mt-1.5 leading-relaxed font-medium">
            Compare NHS cancer wait times and distances instantly based on public data.
          </p>
        </div>

        {/* Search form */}
        <div className="px-6 pb-6">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[13px]">
            {error}
          </div>
        )}

        {/* Results header */}
        {data && (
          <div className="px-6 py-3 border-t border-cp-border flex items-center justify-between">
            <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-text-muted opacity-70">
              {data.results.length} hospitals found nearby
            </span>
            <span className="text-[0.7rem] uppercase font-semibold tracking-[0.05em] text-cp-dark">
              Best match &#8595;
            </span>
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto border-t border-cp-border">
          {data && data.results.length > 0 ? (
            <div className="divide-y divide-cp-border">
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
            <div className="px-6 py-12 text-center text-cp-text-muted text-sm">
              No hospitals found for this cancer type in your area.
            </div>
          ) : !loading ? (
            <div className="px-6 py-12 text-center text-cp-text-muted opacity-50 text-sm">
              Select a condition and location to see results
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cp-border text-[11px] text-cp-text-muted opacity-60">
          Source: NHS England Cancer Waiting Times {data?.period || ''} &middot; Indicative only
        </div>
      </div>

      {/* Right panel — Map */}
      <div className="flex-1 bg-cp-bg relative">
        <ResultsMap
          results={data?.results || []}
          userLocation={data?.user_location}
          highlightOds={hoveredOds}
        />
      </div>
    </div>
  );
}

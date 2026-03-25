import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { SearchResponse } from '../api/client';

export function useSearch() {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (cancerType: string, postcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.search(cancerType, postcode);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, search };
}

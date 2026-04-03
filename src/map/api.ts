import type { SearchResponse, SearchParams } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  search: (params: SearchParams) => {
    const ct = encodeURIComponent(params.cancerType);
    if ('postcode' in params) {
      return fetchJSON<SearchResponse>(`/search?cancer_type=${ct}&postcode=${encodeURIComponent(params.postcode)}`);
    }
    return fetchJSON<SearchResponse>(`/search?cancer_type=${ct}&lat=${params.lat}&lng=${params.lng}`);
  },
};

// In dev, Vite proxies /api to localhost:8000.
// In production, set VITE_API_URL to the deployed backend (e.g. https://inform-api.railway.app/api)
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const detail = body.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ')
          : detail
            ? JSON.stringify(detail)
            : `API error: ${resp.status}`;
    throw new Error(message);
  }
  return resp.json();
}

export interface SearchResult {
  rank: number;
  ods_code: string;
  name: string;
  lat: number;
  lng: number;
  distance_km: number;
  performance_62d: number | null;
  performance_31d: number | null;
  performance_fds: number | null;
  total_patients_62d: number;
  score: number;
}

export interface SearchResponse {
  postcode: string;
  cancer_type: string;
  period: string;
  user_location: { lat: number; lng: number };
  results: SearchResult[];
}

export interface Provider {
  ods_code: string;
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export interface WaitTimeEntry {
  cancer_type: string;
  display_name: string;
  total_patients: number;
  within_standard: number;
  after_standard: number;
  performance: number;
}

export interface ProviderDetail {
  ods_code: string;
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
  wait_times: Record<string, Record<string, WaitTimeEntry[]>>;
}

export interface CancerType {
  value: string;
  display_name: string;
  standards: string[];
}

export interface SummaryStats {
  period: string;
  provider_count: number;
  cancer_type_count: number;
  total_records: number;
  average_performance: Record<string, number>;
}

export type SearchParams =
  | { cancerType: string; postcode: string }
  | { cancerType: string; lat: number; lng: number };

export const api = {
  search: (params: SearchParams) => {
    const ct = encodeURIComponent(params.cancerType);
    if ('postcode' in params) {
      return fetchJSON<SearchResponse>(`/search?cancer_type=${ct}&postcode=${encodeURIComponent(params.postcode)}`);
    }
    return fetchJSON<SearchResponse>(`/search?cancer_type=${ct}&lat=${params.lat}&lng=${params.lng}`);
  },

  providers: () => fetchJSON<Provider[]>('/providers'),

  provider: (odsCode: string) => fetchJSON<ProviderDetail>(`/providers/${odsCode}`),

  cancerTypes: () => fetchJSON<CancerType[]>('/cancer-types'),

  stats: () => fetchJSON<SummaryStats>('/stats/summary'),
};

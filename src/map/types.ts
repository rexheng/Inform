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

export type SearchParams =
  | { cancerType: string; postcode: string }
  | { cancerType: string; lat: number; lng: number };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSearchContext {
  cancer_type?: string;
  postcode?: string;
  results?: Record<string, unknown>[];
}

export type ReferralType = "urgent" | "two-week-wait" | "routine";

export interface Trust {
  code: string;
  name: string;
  lat: number;
  lng: number;
  borough: string;
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

export interface PatientContext {
  postcode: string;
  cancerType: string;
  cancerLabel: string;
  referralType: ReferralType;
  currentHospital: SearchResult;
  alternatives: SearchResult[];
}

export interface LetterParams {
  patientName: string;
  cancerType: string;
  currentTrust: string;
  currentWaitDays: number;
  requestedTrust: string;
  requestedWaitDays: number;
  postcode: string;
}

export const CANCER_TYPES: { value: string; label: string }[] = [
  { value: "Suspected acute leukaemia", label: "Acute Leukaemia" },
  { value: "Suspected brain/central nervous system tumours", label: "Brain / CNS" },
  { value: "Suspected breast cancer", label: "Breast" },
  { value: "Suspected cancer - non-specific symptoms", label: "Non-Specific Symptoms" },
  { value: "Suspected children's cancer", label: "Children's Cancer" },
  { value: "Suspected gynaecological cancer", label: "Gynaecological" },
  { value: "Suspected haematological malignancies (excluding acute leukaemia)", label: "Haematological" },
  { value: "Suspected head & neck cancer", label: "Head & Neck" },
  { value: "Suspected lower gastrointestinal cancer", label: "Lower GI" },
  { value: "Suspected lung cancer", label: "Lung" },
  { value: "Suspected other cancer", label: "Other" },
  { value: "Suspected sarcoma", label: "Sarcoma" },
  { value: "Suspected skin cancer", label: "Skin" },
  { value: "Suspected testicular cancer", label: "Testicular" },
  { value: "Suspected upper gastrointestinal cancer", label: "Upper GI" },
  { value: "Suspected urological malignancies (excluding testicular)", label: "Urological" },
];

export const REFERRAL_TYPES: { value: ReferralType; label: string }[] = [
  { value: "two-week-wait", label: "Two Week Wait (suspected cancer)" },
  { value: "urgent", label: "Urgent referral" },
  { value: "routine", label: "Routine referral" },
];

/** Convert FDS performance ratio (0–1) to approximate wait days. */
export function perfToWaitDays(perf: number | null): number {
  if (!perf || perf === 0) return 28;
  return Math.round(28 * (2 - perf) / 2);
}

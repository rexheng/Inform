export type Condition = "colorectal" | "breast" | "lung" | "prostate";

export interface Trust {
  code: string;
  name: string;
  lat: number;
  lng: number;
  borough: string;
  waits: Record<Condition, number>;
  target_met: {
    "28day": boolean;
    "62day": boolean;
  };
}

export interface TrustWithDistance extends Trust {
  distanceMiles: number;
  travelMinutes: number;
}

export interface PostcodeResult {
  lat: number;
  lng: number;
  borough: string;
}

export interface PatientContext {
  postcode: string;
  condition: Condition;
  location: PostcodeResult;
  currentTrust: Trust;
  alternatives: TrustWithDistance[];
}

export interface LetterParams {
  patientName: string;
  condition: Condition;
  currentTrust: string;
  weeksWaiting: number;
  requestedTrust: string;
  requestedWaitTime: number;
  postcode: string;
}

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "colorectal", label: "Colorectal" },
  { value: "breast", label: "Breast" },
  { value: "lung", label: "Lung" },
  { value: "prostate", label: "Prostate" },
];

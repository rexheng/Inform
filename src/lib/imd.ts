import deprivationData from "@/../data/deprivation.json";

interface DeprivationInfo {
  imdDecile: number;
  imdScore: number;
}

const data = deprivationData as Record<string, DeprivationInfo>;

export function getDeprivation(borough: string): DeprivationInfo | null {
  return data[borough] ?? null;
}

export function getDeprivationLabel(decile: number): string {
  if (decile <= 2) return "Most deprived";
  if (decile <= 4) return "Above average deprivation";
  if (decile <= 6) return "Average";
  if (decile <= 8) return "Below average deprivation";
  return "Least deprived";
}

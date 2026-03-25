import trustsData from "@/../data/trusts.json";
interface LegacyTrust { code: string; name: string; lat: number; lng: number; borough: string; waits: Record<string, number>; target_met: Record<string, boolean>; }
const trustsRaw = trustsData as Record<string, Omit<LegacyTrust, "code">>;
export function getAllTrusts(): LegacyTrust[] { return Object.entries(trustsRaw).map(([code, data]) => ({ code, ...data })); }
export function getTrustByCode(code: string): LegacyTrust | undefined { const data = trustsRaw[code]; if (!data) return undefined; return { code, ...data }; }

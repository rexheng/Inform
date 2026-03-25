import trustsData from "@/../data/trusts.json";
import { Trust, TrustWithDistance, Condition } from "./types";

const trustsRaw = trustsData as Record<string, Omit<Trust, "code">>;

export function getAllTrusts(): Trust[] {
  return Object.entries(trustsRaw).map(([code, data]) => ({ code, ...data }));
}

export function getTrustByCode(code: string): Trust | undefined {
  const data = trustsRaw[code];
  if (!data) return undefined;
  return { code, ...data };
}

export function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateTravelMinutes(distanceMiles: number): number {
  return Math.round((distanceMiles / 15) * 60);
}

export function findNearestTrust(lat: number, lng: number): Trust {
  const trusts = getAllTrusts();
  let nearest = trusts[0];
  let minDist = Infinity;
  for (const trust of trusts) {
    const dist = haversineDistanceMiles(lat, lng, trust.lat, trust.lng);
    if (dist < minDist) { minDist = dist; nearest = trust; }
  }
  return nearest;
}

export function getNearbyAlternatives(lat: number, lng: number, condition: Condition, currentTrustCode: string, maxDistanceMiles: number = 15): TrustWithDistance[] {
  return getAllTrusts()
    .filter((t) => t.code !== currentTrustCode)
    .map((trust) => {
      const distanceMiles = haversineDistanceMiles(lat, lng, trust.lat, trust.lng);
      const travelMinutes = estimateTravelMinutes(distanceMiles);
      return { ...trust, distanceMiles, travelMinutes };
    })
    .filter((t) => t.distanceMiles <= maxDistanceMiles)
    .sort((a, b) => a.waits[condition] - b.waits[condition]);
}

import trustsData from "@/../data/trusts.json";
import { Trust, TrustWithDistance, Condition } from "./types";

const trustsRaw = trustsData as Record<string, Omit<Trust, "code">>;

export function getAllTrusts(): Trust[] {
  return Object.entries(trustsRaw).map(([code, data]) => ({
    code,
    ...data,
  }));
}

export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateTravelMinutes(distanceMiles: number): number {
  // Rough estimate at 15mph average London speed
  return Math.round((distanceMiles / 15) * 60);
}

export function findNearestTrust(lat: number, lng: number): Trust {
  const trusts = getAllTrusts();
  let nearest = trusts[0];
  let minDist = Infinity;

  for (const trust of trusts) {
    const dist = haversineDistanceMiles(lat, lng, trust.lat, trust.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = trust;
    }
  }

  return nearest;
}

export function getNearbyAlternatives(
  lat: number,
  lng: number,
  condition: Condition,
  currentTrustCode: string,
  maxDistanceMiles: number = 15
): TrustWithDistance[] {
  const trusts = getAllTrusts();

  return trusts
    .filter((t) => t.code !== currentTrustCode)
    .map((trust) => {
      const distanceMiles = haversineDistanceMiles(lat, lng, trust.lat, trust.lng);
      const travelMinutes = estimateTravelMinutes(distanceMiles);
      return { ...trust, distanceMiles, travelMinutes };
    })
    .filter((t) => t.distanceMiles <= maxDistanceMiles)
    .sort((a, b) => a.waits[condition] - b.waits[condition]);
}

export function getWaitColour(weeks: number): string {
  if (weeks >= 15) return "wait-red";
  if (weeks >= 12) return "wait-amber";
  if (weeks >= 9) return "wait-yellow";
  return "wait-green";
}

export function getWaitColourHex(weeks: number): string {
  if (weeks >= 15) return "#F09595";
  if (weeks >= 12) return "#FAC775";
  if (weeks >= 9) return "#C0DD97";
  return "#5DCAA5";
}

import type { SearchResult } from '../../api/client.ts';
import type { TrustLane } from './types.ts';

// ---------------------------------------------------------------------------
// Colour constants — RGB tuples in 0-1 range
// ---------------------------------------------------------------------------

export const COLOURS = {
  spawn:    [0.376, 0.647, 0.980] as [number, number, number], // #60A5FA
  onTime:   [0.133, 0.773, 0.333] as [number, number, number], // #22C55E
  slowing:  [0.961, 0.620, 0.043] as [number, number, number], // #F59E0B
  breached: [0.937, 0.267, 0.267] as [number, number, number], // #EF4444
} as const;

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

/** Linear interpolation between two RGB tuples. t is clamped to [0, 1]. */
export function lerpColour(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const tc = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * tc,
    a[1] + (b[1] - a[1]) * tc,
    a[2] + (b[2] - a[2]) * tc,
  ];
}

// ---------------------------------------------------------------------------
// Data transformation
// ---------------------------------------------------------------------------

const SINGLE_MODE_MAX_PARTICLES = 300;
const COMPARE_MODE_MAX_PARTICLES = 50;
const MIN_PARTICLES = 1;

/**
 * Convert API search results into TrustLane descriptors for the particle
 * visualization. Particle counts are scaled proportionally to
 * `total_patients_62d` within the chosen cap, with a minimum of 1.
 */
export function searchResultsToLanes(
  results: SearchResult[],
  compareMode: boolean,
): TrustLane[] {
  if (results.length === 0) return [];

  const cap = compareMode ? COMPARE_MODE_MAX_PARTICLES : SINGLE_MODE_MAX_PARTICLES;
  const maxPatients = Math.max(...results.map(r => r.total_patients_62d), 1);

  return results.map((r): TrustLane => {
    const fds          = r.performance_fds  ?? 0;
    const thirtyOneDay = r.performance_31d  ?? 0;
    const sixtyTwoDay  = r.performance_62d  ?? 0;

    // Breached patients: those who fell outside the 62-day standard.
    const breachedFraction = Math.max(0, 1 - sixtyTwoDay);
    const breachedPatients = Math.round(r.total_patients_62d * breachedFraction);

    // Rough estimate: every breached patient waits ~14 extra days on average.
    const estimatedDaysLost = breachedPatients * 14;

    const rawParticles = (r.total_patients_62d / maxPatients) * cap;
    const particleCount = Math.max(MIN_PARTICLES, Math.round(rawParticles));

    return {
      odsCode: r.ods_code,
      name: r.name,
      totalPatients62d: r.total_patients_62d,
      particleCount,
      gatePerformance: { fds, thirtyOneDay, sixtyTwoDay },
      breachedPatients,
      estimatedDaysLost,
    };
  });
}

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

/** Sum of estimated days lost across all lanes. */
export function totalDaysLost(lanes: TrustLane[]): number {
  return lanes.reduce((acc, lane) => acc + lane.estimatedDaysLost, 0);
}

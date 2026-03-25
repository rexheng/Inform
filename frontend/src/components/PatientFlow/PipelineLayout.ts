import type { GatePosition, LaneLayout } from './types';

const PADDING_X = 0.08;
const PADDING_Y = 0.06;
const LANE_GAP = 0.02;

export interface LayoutResult {
  gates: GatePosition[];
  lanes: LaneLayout[];
  spawnX: number;
  exitX: number;
}

export function computeLayout(
  laneCount: number,
  compareMode: boolean,
  odsCodesInOrder: string[],
): LayoutResult {
  const spawnX = PADDING_X;
  const exitX = 1 - PADDING_X;

  // Gates sit at 25%, 50%, 75% of the usable horizontal span
  const usableWidth = exitX - spawnX;
  const gatePositions = [0.25, 0.5, 0.75].map((frac) => spawnX + frac * usableWidth);

  const gates: GatePosition[] = [
    { x: gatePositions[0], label: 'Diagnosis · 28 days', standard: 'FDS' },
    { x: gatePositions[1], label: 'Decision · 31 days',  standard: '31D' },
    { x: gatePositions[2], label: 'Treatment · 62 days', standard: '62D' },
  ];

  let lanes: LaneLayout[];

  if (!compareMode || laneCount <= 1) {
    // Single lane: one band occupying the full usable vertical space
    const odsCode = odsCodesInOrder[0] ?? '';
    lanes = [
      {
        yCenter: 0.5,
        height: 1 - PADDING_Y * 2,
        odsCode,
      },
    ];
  } else {
    // Multiple lanes stacked with LANE_GAP between them
    const usableHeight = 1 - PADDING_Y * 2;
    const totalGapHeight = LANE_GAP * (laneCount - 1);
    const laneHeight = (usableHeight - totalGapHeight) / laneCount;

    lanes = Array.from({ length: laneCount }, (_, i) => {
      // Top of the first lane starts at PADDING_Y; subsequent lanes follow
      const topY = PADDING_Y + i * (laneHeight + LANE_GAP);
      const yCenter = topY + laneHeight / 2;
      const odsCode = odsCodesInOrder[i] ?? '';
      return { yCenter, height: laneHeight, odsCode };
    });
  }

  return { gates, lanes, spawnX, exitX };
}

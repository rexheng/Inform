/** Data for one trust's lane in the particle visualization. */
export interface TrustLane {
  odsCode: string;
  name: string;
  totalPatients62d: number;
  particleCount: number;
  gatePerformance: {
    fds: number;         // 0-1
    thirtyOneDay: number; // 0-1
    sixtyTwoDay: number;  // 0-1
  };
  breachedPatients: number;
  estimatedDaysLost: number;
}

export interface ParticleData {
  laneIndex: number;
  x: number;
  y: number;
  baseVelocity: number;
  velocity: number;
  slowAtGate: [boolean, boolean, boolean]; // [FDS, 31D, 62D]
  progress: number;
  colourPhase: number;
  pulsePhase: number;
  alive: boolean;
  opacity: number;
}

export interface GatePosition {
  x: number;
  label: string;
  standard: string; // "FDS" | "31D" | "62D"
}

export interface LaneLayout {
  yCenter: number;
  height: number;
  odsCode: string;
}

export interface GateHoverData {
  trustOdsCode: string;
  trustName: string;
  standard: string;
  gateLabel: string;
  patientsWaiting: number;
  breachedPercent: number;
}

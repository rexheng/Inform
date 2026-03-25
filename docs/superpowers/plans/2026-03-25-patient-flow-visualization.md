# Patient Flow Particle Visualization — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Three.js particle river visualization as a tab alongside the Leaflet map on the Results page, showing cancer patients flowing through NHS pathway stages with bottlenecks visible at underperforming trusts.

**Architecture:** Raw Three.js with a single `InstancedMesh` and custom GLSL shaders. The visualization is a React component (`PatientFlowCanvas`) that receives search results as props and renders particles flowing through 4 pipeline stages. It integrates into the existing `SearchPage` via a tab switcher that toggles between the Leaflet map and the Three.js canvas. No React Three Fiber — vanilla Three.js for maximum control.

**Tech Stack:** Three.js (new dependency), React 19, TypeScript 5.9, Tailwind CSS 4, Vite 8

**Spec:** `docs/superpowers/specs/2026-03-25-patient-flow-visualization-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `frontend/src/components/PatientFlow/types.ts` | TrustLane, ParticleData, GateStats interfaces |
| Create | `frontend/src/components/PatientFlow/utils.ts` | Data derivation: search results → TrustLane[], colour lerp |
| Create | `frontend/src/components/PatientFlow/PipelineLayout.ts` | Gate x-positions, lane y-centres, responsive recalc |
| Create | `frontend/src/components/PatientFlow/ParticleShader.ts` | GLSL vertex + fragment shader strings |
| Create | `frontend/src/components/PatientFlow/ParticleSystem.ts` | InstancedMesh, spawn/update loop, fate assignment |
| Create | `frontend/src/components/PatientFlow/HitboxManager.ts` | Invisible gate hitboxes, raycaster, tooltip data |
| Create | `frontend/src/components/PatientFlow/PatientFlowCanvas.tsx` | React wrapper: mount/unmount Three.js, props bridge |
| Modify | `frontend/src/pages/SearchPage.tsx` | Add tab state, toggle between ResultsMap and PatientFlowCanvas |
| Modify | `frontend/package.json` | Add `three` and `@types/three` dependencies |

---

## Chunk 1: Foundation — Types, Utils, Dependencies

### Task 1: Install Three.js

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install three and types**

```bash
cd frontend && npm install three && npm install -D @types/three
```

- [ ] **Step 2: Verify installation**

```bash
cd frontend && node -e "require('three'); console.log('three OK')"
```
Expected: `three OK`

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add three.js dependency"
```

---

### Task 2: Create type definitions

**Files:**
- Create: `frontend/src/components/PatientFlow/types.ts`

- [ ] **Step 1: Write types file**

```typescript
// frontend/src/components/PatientFlow/types.ts

/** Data for one trust's lane in the particle visualization. */
export interface TrustLane {
  odsCode: string;
  name: string;
  totalPatients62d: number;
  particleCount: number;
  gatePerformance: {
    fds: number;        // 0-1
    thirtyOneDay: number; // 0-1
    sixtyTwoDay: number;  // 0-1
  };
  breachedPatients: number;
  estimatedDaysLost: number;
}

/** Internal state for a single particle in the simulation. */
export interface ParticleData {
  laneIndex: number;
  x: number;
  y: number;
  baseVelocity: number;
  velocity: number;
  /** Which gates this particle will bottleneck at (assigned on spawn). */
  slowAtGate: [boolean, boolean, boolean]; // [FDS, 31D, 62D]
  /** 0 = just spawned, 1 = exiting right edge */
  progress: number;
  /** Current colour state: 0=blue, 1=green, 2=amber, 3=red */
  colourPhase: number;
  /** For breached particles: pulse phase offset */
  pulsePhase: number;
  alive: boolean;
  opacity: number;
}

/** Layout output for a single gate position. */
export interface GatePosition {
  x: number;
  label: string;
  standard: string; // "FDS" | "31D" | "62D"
}

/** Layout for one trust lane. */
export interface LaneLayout {
  yCenter: number;
  height: number;
  odsCode: string;
}

/** Data returned when hovering a gate hitbox. */
export interface GateHoverData {
  trustOdsCode: string;
  trustName: string;
  standard: string;
  gateLabel: string;
  patientsWaiting: number;
  breachedPercent: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/types.ts
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/types.ts
git commit -m "feat(patient-flow): add type definitions"
```

---

### Task 3: Create data utils — transform search results to TrustLane[]

**Files:**
- Create: `frontend/src/components/PatientFlow/utils.ts`

- [ ] **Step 1: Write utils**

```typescript
// frontend/src/components/PatientFlow/utils.ts

import type { SearchResult } from '../../api/client';
import type { TrustLane } from './types';

const SINGLE_MODE_CAP = 300;
const COMPARE_MODE_CAP = 50;
const MIN_PARTICLES = 1;

/**
 * Convert search results into TrustLane data for the particle system.
 * Handles null performance values by defaulting to 0.
 */
export function searchResultsToLanes(
  results: SearchResult[],
  compareMode: boolean,
): TrustLane[] {
  const cap = compareMode ? COMPARE_MODE_CAP : SINGLE_MODE_CAP;

  return results
    .filter(r => r.total_patients_62d > 0)
    .map(r => {
      const fds = r.performance_fds ?? 0;
      const thirtyOneDay = r.performance_31d ?? 0;
      const sixtyTwoDay = r.performance_62d ?? 0;
      const rawCount = Math.round(r.total_patients_62d / 10);
      const particleCount = Math.max(MIN_PARTICLES, Math.min(rawCount, cap));
      const breachedPatients = Math.round((1 - sixtyTwoDay) * r.total_patients_62d);

      return {
        odsCode: r.ods_code,
        name: r.name,
        totalPatients62d: r.total_patients_62d,
        particleCount,
        gatePerformance: { fds, thirtyOneDay, sixtyTwoDay },
        breachedPatients,
        estimatedDaysLost: breachedPatients * 30,
      };
    });
}

/** Total estimated days lost across all visible trusts. */
export function totalDaysLost(lanes: TrustLane[]): number {
  return lanes.reduce((sum, l) => sum + l.estimatedDaysLost, 0);
}

/** Hex colour constants. */
export const COLOURS = {
  spawn: [0x60 / 255, 0xa5 / 255, 0xfa / 255] as [number, number, number],     // #60A5FA
  onTime: [0x22 / 255, 0xc5 / 255, 0x5e / 255] as [number, number, number],    // #22C55E
  slowing: [0xf5 / 255, 0x9e / 255, 0x0b / 255] as [number, number, number],   // #F59E0B
  breached: [0xef / 255, 0x44 / 255, 0x44 / 255] as [number, number, number],  // #EF4444
} as const;

/** Lerp between two RGB tuples. */
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/utils.ts
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/utils.ts
git commit -m "feat(patient-flow): add data utils and colour helpers"
```

---

## Chunk 2: Three.js Core — Layout, Shaders, Particle System

### Task 4: PipelineLayout — compute gate positions and lane geometry

**Files:**
- Create: `frontend/src/components/PatientFlow/PipelineLayout.ts`

- [ ] **Step 1: Write PipelineLayout**

```typescript
// frontend/src/components/PatientFlow/PipelineLayout.ts

import type { GatePosition, LaneLayout } from './types';

const PADDING_X = 0.08; // 8% padding on each side
const PADDING_Y = 0.06;
const LANE_GAP = 0.02;  // 2% gap between lanes in compare mode

export interface LayoutResult {
  gates: GatePosition[];
  lanes: LaneLayout[];
  spawnX: number;
  exitX: number;
  width: number;
  height: number;
}

/**
 * Compute the layout for the pipeline visualization.
 * All coordinates are in normalized [0,1] space — the renderer scales to canvas pixels.
 */
export function computeLayout(
  laneCount: number,
  compareMode: boolean,
  odsCodesInOrder: string[],
): LayoutResult {
  const spawnX = PADDING_X;
  const exitX = 1 - PADDING_X;
  const usableWidth = exitX - spawnX;

  // Gates at 25%, 50%, 75% of usable width
  const gateOffsets = [0.25, 0.50, 0.75];
  const gates: GatePosition[] = [
    { x: spawnX + usableWidth * gateOffsets[0], label: 'Diagnosis · 28 days', standard: 'FDS' },
    { x: spawnX + usableWidth * gateOffsets[1], label: 'Decision · 31 days', standard: '31D' },
    { x: spawnX + usableWidth * gateOffsets[2], label: 'Treatment · 62 days', standard: '62D' },
  ];

  // Lanes
  const lanes: LaneLayout[] = [];
  if (!compareMode || laneCount <= 1) {
    // Single lane: full height
    lanes.push({
      yCenter: 0.5,
      height: 1 - PADDING_Y * 2,
      odsCode: odsCodesInOrder[0] || '',
    });
  } else {
    const totalGap = LANE_GAP * (laneCount - 1);
    const usableHeight = 1 - PADDING_Y * 2 - totalGap;
    const laneHeight = usableHeight / laneCount;

    for (let i = 0; i < laneCount; i++) {
      const yTop = PADDING_Y + i * (laneHeight + LANE_GAP);
      lanes.push({
        yCenter: yTop + laneHeight / 2,
        height: laneHeight,
        odsCode: odsCodesInOrder[i] || '',
      });
    }
  }

  return { gates, lanes, spawnX, exitX, width: 1, height: 1 };
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/PipelineLayout.ts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/PipelineLayout.ts
git commit -m "feat(patient-flow): add pipeline layout calculator"
```

---

### Task 5: ParticleShader — GLSL vertex + fragment

**Files:**
- Create: `frontend/src/components/PatientFlow/ParticleShader.ts`

- [ ] **Step 1: Write shader strings**

```typescript
// frontend/src/components/PatientFlow/ParticleShader.ts

export const vertexShader = /* glsl */ `
  attribute vec3 aColour;
  attribute float aOpacity;
  attribute float aPhase;

  varying vec3 vColour;
  varying float vOpacity;
  varying float vPhase;

  void main() {
    vColour = aColour;
    vOpacity = aOpacity;
    vPhase = aPhase;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Scale point size by distance for consistent apparent size
    gl_PointSize = 8.0;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform float uTime;

  varying vec3 vColour;
  varying float vOpacity;
  varying float vPhase;

  void main() {
    // Soft circle: distance from centre of the point sprite
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Radial alpha falloff for soft edges
    float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;

    // Pulsing glow for breached particles (phase > 0)
    float glow = 1.0;
    if (vPhase > 0.0) {
      glow = sin(uTime * 3.0 + vPhase) * 0.3 + 1.0;
    }

    gl_FragColor = vec4(vColour * glow, alpha);
  }
`;
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/ParticleShader.ts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/ParticleShader.ts
git commit -m "feat(patient-flow): add GLSL particle shaders"
```

---

### Task 6: ParticleSystem — the core simulation engine

**Files:**
- Create: `frontend/src/components/PatientFlow/ParticleSystem.ts`

- [ ] **Step 1: Write ParticleSystem class**

```typescript
// frontend/src/components/PatientFlow/ParticleSystem.ts

import * as THREE from 'three';
import type { TrustLane, ParticleData } from './types';
import type { LayoutResult } from './PipelineLayout';
import { vertexShader, fragmentShader } from './ParticleShader';
import { COLOURS, lerpColour } from './utils';

const MAX_PARTICLES = 2000;
const PARTICLE_RADIUS = 0.004; // In normalized coords
const TRAVERSE_TIME = 4.0;     // Seconds for a fast particle to cross the full pipeline
const BOTTLENECK_SPEED_FACTOR = 0.15; // Slow particles move at 15% of normal speed

export class ParticleSystem {
  private mesh: THREE.InstancedMesh;
  private material: THREE.ShaderMaterial;
  private particles: ParticleData[] = [];
  private colourAttr!: THREE.InstancedBufferAttribute;
  private opacityAttr!: THREE.InstancedBufferAttribute;
  private phaseAttr!: THREE.InstancedBufferAttribute;
  private dummy = new THREE.Object3D();

  private lanes: TrustLane[] = [];
  private layout: LayoutResult | null = null;
  private spawnTimers: number[] = []; // Per-lane spawn countdown
  private canvasWidth = 1;
  private canvasHeight = 1;

  constructor(scene: THREE.Scene) {
    // Circle geometry — flat disc
    const geo = new THREE.CircleGeometry(PARTICLE_RADIUS, 8);

    // Custom shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.InstancedMesh(geo, this.material, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0; // Start with 0 visible instances

    // Create per-instance buffer attributes
    const colourArray = new Float32Array(MAX_PARTICLES * 3);
    const opacityArray = new Float32Array(MAX_PARTICLES);
    const phaseArray = new Float32Array(MAX_PARTICLES);

    this.colourAttr = new THREE.InstancedBufferAttribute(colourArray, 3);
    this.opacityAttr = new THREE.InstancedBufferAttribute(opacityArray, 1);
    this.phaseAttr = new THREE.InstancedBufferAttribute(phaseArray, 1);

    geo.setAttribute('aColour', this.colourAttr);
    geo.setAttribute('aOpacity', this.opacityAttr);
    geo.setAttribute('aPhase', this.phaseAttr);

    scene.add(this.mesh);
  }

  setTrustData(lanes: TrustLane[], layout: LayoutResult): void {
    this.lanes = lanes;
    this.layout = layout;
    this.particles = [];
    this.spawnTimers = lanes.map(() => 0);
    this.mesh.count = 0;
  }

  setCanvasSize(w: number, h: number): void {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  update(dt: number, elapsed: number): void {
    if (!this.layout || this.lanes.length === 0) return;

    this.material.uniforms.uTime.value = elapsed;

    // Spawn new particles per lane
    for (let li = 0; li < this.lanes.length; li++) {
      const lane = this.lanes[li];
      if (lane.particleCount === 0) continue;

      this.spawnTimers[li] -= dt;
      if (this.spawnTimers[li] <= 0 && this.particles.length < MAX_PARTICLES) {
        this.spawnParticle(li);
        this.spawnTimers[li] = TRAVERSE_TIME / lane.particleCount;
      }
    }

    // Update all particles
    const gateXs = this.layout.gates.map(g => g.x);
    const { spawnX, exitX } = this.layout;
    const totalDist = exitX - spawnX;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p.alive) continue;

      const laneLayout = this.layout.lanes[p.laneIndex];
      if (!laneLayout) continue;

      // Check if approaching a bottleneck gate
      let currentVelocity = p.baseVelocity;
      let isBottlenecked = false;

      for (let g = 0; g < 3; g++) {
        if (p.slowAtGate[g]) {
          const gateX = gateXs[g];
          const approachDist = gateX - p.x;
          // Start slowing when within 5% of total width before the gate
          if (approachDist > 0 && approachDist < totalDist * 0.05) {
            currentVelocity = p.baseVelocity * BOTTLENECK_SPEED_FACTOR;
            isBottlenecked = true;
          }
          // If past the gate, keep slow for a bit then release
          if (approachDist < 0 && approachDist > -totalDist * 0.03) {
            currentVelocity = p.baseVelocity * 0.5;
            isBottlenecked = true;
          }
        }
      }

      p.velocity = currentVelocity;
      p.x += p.velocity * dt;
      p.progress = (p.x - spawnX) / totalDist;

      // Add small vertical jitter for visual interest
      const jitter = Math.sin(elapsed * 2 + i * 0.7) * laneLayout.height * 0.03;

      // Update colour based on state
      let colour: [number, number, number];
      if (isBottlenecked && p.progress > 0.7) {
        colour = COLOURS.breached;
        p.pulsePhase = elapsed; // Enable pulse
      } else if (isBottlenecked) {
        colour = lerpColour(COLOURS.spawn, COLOURS.slowing, p.progress * 2);
      } else {
        colour = lerpColour(COLOURS.spawn, COLOURS.onTime, p.progress);
      }

      // Fade in on spawn, fade out on exit
      if (p.progress < 0.05) {
        p.opacity = p.progress / 0.05;
      } else if (p.progress > 0.95) {
        p.opacity = (1 - p.progress) / 0.05;
      } else {
        p.opacity = 1;
      }

      // Kill if past exit
      if (p.x > exitX + 0.02) {
        p.alive = false;
        continue;
      }

      // Write to instance buffers
      this.dummy.position.set(p.x, laneLayout.yCenter + jitter, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      this.colourAttr.setXYZ(i, colour[0], colour[1], colour[2]);
      this.opacityAttr.setX(i, p.opacity);
      this.phaseAttr.setX(i, isBottlenecked && p.progress > 0.7 ? p.pulsePhase : 0);
    }

    // Compact: remove dead particles from the end
    while (this.particles.length > 0 && !this.particles[this.particles.length - 1].alive) {
      this.particles.pop();
    }

    this.mesh.count = this.particles.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.colourAttr.needsUpdate = true;
    this.opacityAttr.needsUpdate = true;
    this.phaseAttr.needsUpdate = true;
  }

  private spawnParticle(laneIndex: number): void {
    if (!this.layout) return;
    const lane = this.lanes[laneIndex];
    const perf = lane.gatePerformance;
    const { spawnX, exitX } = this.layout;
    const totalDist = exitX - spawnX;
    const baseVelocity = totalDist / TRAVERSE_TIME;

    const particle: ParticleData = {
      laneIndex,
      x: spawnX,
      y: 0,
      baseVelocity,
      velocity: baseVelocity,
      // Randomly assign fate per gate based on compliance rate
      slowAtGate: [
        Math.random() > perf.fds,
        Math.random() > perf.thirtyOneDay,
        Math.random() > perf.sixtyTwoDay,
      ],
      progress: 0,
      colourPhase: 0,
      pulsePhase: 0,
      alive: true,
      opacity: 0,
    };

    this.particles.push(particle);
  }

  /** Get counts of particles currently bottlenecked near each gate, per lane. */
  getBottleneckCounts(): Map<string, number[]> {
    if (!this.layout) return new Map();
    const gateXs = this.layout.gates.map(g => g.x);
    const totalDist = this.layout.exitX - this.layout.spawnX;
    const counts = new Map<string, number[]>();

    for (const lane of this.layout.lanes) {
      counts.set(lane.odsCode, [0, 0, 0]);
    }

    for (const p of this.particles) {
      if (!p.alive) continue;
      const laneLayout = this.layout.lanes[p.laneIndex];
      if (!laneLayout) continue;

      for (let g = 0; g < 3; g++) {
        if (p.slowAtGate[g]) {
          const dist = Math.abs(p.x - gateXs[g]);
          if (dist < totalDist * 0.06) {
            const arr = counts.get(laneLayout.odsCode);
            if (arr) arr[g]++;
          }
        }
      }
    }

    return counts;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.colourAttr.array = new Float32Array(0);
    this.opacityAttr.array = new Float32Array(0);
    this.phaseAttr.array = new Float32Array(0);
    this.mesh.removeFromParent();
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/ParticleSystem.ts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/ParticleSystem.ts
git commit -m "feat(patient-flow): add particle system engine with InstancedMesh"
```

---

## Chunk 3: Interaction — Hitboxes, Canvas Wrapper, Tab Integration

### Task 7: HitboxManager — raycasting for tooltips

**Files:**
- Create: `frontend/src/components/PatientFlow/HitboxManager.ts`

- [ ] **Step 1: Write HitboxManager**

```typescript
// frontend/src/components/PatientFlow/HitboxManager.ts

import * as THREE from 'three';
import type { LayoutResult } from './PipelineLayout';
import type { TrustLane, GateHoverData } from './types';

const HITBOX_HALF_WIDTH = 0.03; // Normalized
const HITBOX_DEPTH = 0.001;

export class HitboxManager {
  private hitboxes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hitboxData: { odsCode: string; gateIndex: number }[] = [];

  constructor(private scene: THREE.Scene) {}

  buildHitboxes(layout: LayoutResult, lanes: TrustLane[]): void {
    this.clear();

    const geo = new THREE.PlaneGeometry(HITBOX_HALF_WIDTH * 2, 1);
    const mat = new THREE.MeshBasicMaterial({ visible: false });

    for (const lane of layout.lanes) {
      const trustLane = lanes.find(l => l.odsCode === lane.odsCode);
      if (!trustLane) continue;

      for (let g = 0; g < layout.gates.length; g++) {
        const gate = layout.gates[g];
        const mesh = new THREE.Mesh(geo.clone(), mat);
        mesh.position.set(gate.x, lane.yCenter, HITBOX_DEPTH);
        mesh.scale.set(1, lane.height, 1);
        this.scene.add(mesh);
        this.hitboxes.push(mesh);
        this.hitboxData.push({ odsCode: lane.odsCode, gateIndex: g });
      }
    }
  }

  /**
   * Test mouse position against hitboxes.
   * @param mouseX normalized device coord (-1 to 1)
   * @param mouseY normalized device coord (-1 to 1)
   * @param camera the orthographic camera
   * @param lanes trust data for tooltip generation
   * @param layout for gate label lookup
   */
  test(
    mouseX: number,
    mouseY: number,
    camera: THREE.OrthographicCamera,
    lanes: TrustLane[],
    layout: LayoutResult,
  ): GateHoverData | null {
    this.mouse.set(mouseX, mouseY);
    this.raycaster.setFromCamera(this.mouse, camera);

    const intersects = this.raycaster.intersectObjects(this.hitboxes);
    if (intersects.length === 0) return null;

    const hitIdx = this.hitboxes.indexOf(intersects[0].object as THREE.Mesh);
    if (hitIdx < 0) return null;

    const { odsCode, gateIndex } = this.hitboxData[hitIdx];
    const lane = lanes.find(l => l.odsCode === odsCode);
    if (!lane) return null;

    const gate = layout.gates[gateIndex];
    const perfKey = gateIndex === 0 ? 'fds' : gateIndex === 1 ? 'thirtyOneDay' : 'sixtyTwoDay';
    const perf = lane.gatePerformance[perfKey];
    const breachedPct = Math.round((1 - perf) * 100);
    const patientsWaiting = Math.round((1 - perf) * lane.totalPatients62d);

    return {
      trustOdsCode: odsCode,
      trustName: lane.name,
      standard: gate.standard,
      gateLabel: gate.label,
      patientsWaiting,
      breachedPercent: breachedPct,
    };
  }

  clear(): void {
    for (const mesh of this.hitboxes) {
      mesh.geometry.dispose();
      mesh.removeFromParent();
    }
    this.hitboxes = [];
    this.hitboxData = [];
  }

  dispose(): void {
    this.clear();
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/HitboxManager.ts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/HitboxManager.ts
git commit -m "feat(patient-flow): add hitbox manager for gate raycasting"
```

---

### Task 8: PatientFlowCanvas — React wrapper component

**Files:**
- Create: `frontend/src/components/PatientFlow/PatientFlowCanvas.tsx`

- [ ] **Step 1: Write the React wrapper**

```tsx
// frontend/src/components/PatientFlow/PatientFlowCanvas.tsx

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { SearchResult } from '../../api/client';
import type { GateHoverData, TrustLane } from './types';
import { searchResultsToLanes, totalDaysLost } from './utils';
import { computeLayout } from './PipelineLayout';
import { ParticleSystem } from './ParticleSystem';
import { HitboxManager } from './HitboxManager';

interface Props {
  results: SearchResult[];
  selectedTrust?: string;
  onTrustHover?: (odsCode: string | undefined) => void;
  onGateClick?: (odsCode: string, standard: string) => void;
}

export function PatientFlowCanvas({ results, selectedTrust, onTrustHover, onGateClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const [compareMode, setCompareMode] = useState(false);
  const [hoverData, setHoverData] = useState<GateHoverData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Derived data
  const activeTrust = selectedTrust || results[0]?.ods_code;
  const displayResults = compareMode ? results : results.filter(r => r.ods_code === activeTrust);
  const lanes = searchResultsToLanes(displayResults, compareMode);
  const daysLost = totalDaysLost(searchResultsToLanes(results, false));

  // Store lanes in ref so animation loop reads latest
  const lanesRef = useRef<TrustLane[]>(lanes);
  lanesRef.current = lanes;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">WebGL not supported — try a different browser</div>';
      return;
    }

    // Setup Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb); // matches bg-gray-50

    const w = container.clientWidth;
    const h = container.clientHeight;
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const particleSystem = new ParticleSystem(scene);
    const hitboxManager = new HitboxManager(scene);

    // Draw static gate lines
    const drawGateLines = (layout: ReturnType<typeof computeLayout>) => {
      // Remove old lines
      scene.children
        .filter(c => c.userData.isGateLine)
        .forEach(c => scene.remove(c));

      for (const gate of layout.gates) {
        const points = [new THREE.Vector3(gate.x, 0, 0), new THREE.Vector3(gate.x, 1, 0)];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xd1d5db, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(lineGeo, lineMat);
        line.userData.isGateLine = true;
        scene.add(line);
      }
    };

    // Initialize layout
    const odsCodes = lanesRef.current.map(l => l.odsCode);
    let layout = computeLayout(odsCodes.length, compareMode, odsCodes);
    particleSystem.setTrustData(lanesRef.current, layout);
    hitboxManager.buildHitboxes(layout, lanesRef.current);
    drawGateLines(layout);

    // Animation loop
    let lastTime = 0;
    const clock = new THREE.Clock();

    const animate = (time: number) => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05); // Cap delta to avoid huge jumps
      const elapsed = clock.getElapsedTime();

      particleSystem.update(dt, elapsed);
      renderer.render(scene, camera);
    };
    clock.start();
    frameRef.current = requestAnimationFrame(animate);

    // Mouse events
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const hover = hitboxManager.test(mx, my, camera, lanesRef.current, layout);
      setHoverData(hover);
      setTooltipPos({ x: e.clientX - rect.left + 16, y: e.clientY - rect.top - 8 });

      if (onTrustHover) {
        onTrustHover(hover?.trustOdsCode);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (hoverData && onGateClick) {
        onGateClick(hoverData.trustOdsCode, hoverData.standard);
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);

    // Resize handler
    const onResize = () => {
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      renderer.setSize(newW, newH);
      particleSystem.setCanvasSize(newW, newH);
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      particleSystem.dispose();
      hitboxManager.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, [compareMode, activeTrust, results]);

  // Re-set trust data when lanes change (without re-creating the whole scene)
  // This is handled by the dependency array above — compareMode and activeTrust
  // trigger a full remount which is acceptable for tab/trust switching.

  if (results.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        No patient flow data available for this cancer type
      </div>
    );
  }

  const currentLane = lanes.find(l => l.odsCode === activeTrust);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-white">
        <div className="min-w-0">
          {!compareMode && currentLane ? (
            <div>
              <span className="font-semibold text-gray-900 text-sm">{currentLane.name}</span>
              <span className="text-gray-400 text-xs ml-3">
                {currentLane.totalPatients62d.toLocaleString()} patients
                {' · '}
                {Math.round(currentLane.gatePerformance.fds * 100)}% FDS
                {' · '}
                {Math.round(currentLane.gatePerformance.thirtyOneDay * 100)}% 31D
                {' · '}
                {Math.round(currentLane.gatePerformance.sixtyTwoDay * 100)}% 62D
              </span>
            </div>
          ) : (
            <span className="font-semibold text-gray-900 text-sm">All trusts</span>
          )}
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className="text-xs text-[#4a8c7f] hover:underline font-medium shrink-0 ml-4"
        >
          {compareMode ? 'Single View \u2197' : 'Compare All \u2197'}
        </button>
      </div>

      {/* Three.js canvas */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair">
        {/* Tooltip */}
        {hoverData && (
          <div
            className="absolute z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="font-semibold">{hoverData.gateLabel}</div>
            <div className="text-gray-300 mt-0.5">
              {hoverData.patientsWaiting.toLocaleString()} patients waiting
            </div>
            <div className="text-gray-300">
              {hoverData.breachedPercent}% breached standard
            </div>
          </div>
        )}
      </div>

      {/* Days lost counter */}
      <div className="px-4 py-2.5 bg-gray-900 text-white flex items-center justify-between">
        <span className="font-mono text-lg tracking-tight">
          {daysLost.toLocaleString()} days lost
        </span>
        <span className="text-[11px] text-gray-500">
          estimated from monthly data
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit src/components/PatientFlow/PatientFlowCanvas.tsx
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/PatientFlowCanvas.tsx
git commit -m "feat(patient-flow): add React canvas wrapper with tooltip and days-lost counter"
```

---

### Task 9: Integrate into SearchPage with tab switcher

**Files:**
- Modify: `frontend/src/pages/SearchPage.tsx`

- [ ] **Step 1: Add tab state and PatientFlowCanvas import**

In `frontend/src/pages/SearchPage.tsx`, add the import at the top and a `tab` state variable. Replace the right panel `<div>` with a tabbed container:

```tsx
// Add to imports at top of file:
import { PatientFlowCanvas } from '../components/PatientFlow/PatientFlowCanvas';

// Inside SearchPage function, add state:
const [tab, setTab] = useState<'map' | 'flow'>('map');
```

- [ ] **Step 2: Replace the right panel**

Replace lines 91-98 of `SearchPage.tsx` (the right panel div) with:

```tsx
      {/* Right panel — Map or Patient Flow */}
      <div className="flex-1 bg-gray-100 flex flex-col">
        {/* Tab bar */}
        {data && (
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setTab('map')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'map'
                  ? 'border-[#4a8c7f] text-[#4a8c7f]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setTab('flow')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'flow'
                  ? 'border-[#4a8c7f] text-[#4a8c7f]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Patient Flow
            </button>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 relative">
          {tab === 'map' ? (
            <ResultsMap
              results={data?.results || []}
              userLocation={data?.user_location}
              highlightOds={hoveredOds}
            />
          ) : data ? (
            <PatientFlowCanvas
              results={data.results}
              onTrustHover={setHoveredOds}
            />
          ) : null}
        </div>
      </div>
```

- [ ] **Step 3: Verify it compiles**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: Manual smoke test**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`, run a search, switch to the "Patient Flow" tab. Verify:
- Particles appear and flow left to right
- Bottlenecks form at gate lines
- Colours shift from blue → green (fast) or blue → amber → red (slow)
- "Days lost" counter shows at bottom
- Tooltip appears on hover near gate lines
- "Compare All" button toggles parallel lanes
- Switching back to "Map" tab works without errors
- No console errors or WebGL warnings

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SearchPage.tsx
git commit -m "feat(patient-flow): integrate particle visualization as tab in results page"
```

---

## Chunk 4: Polish & Hardening

### Task 10: Add gate labels as HTML overlay

The Three.js canvas doesn't render text well. Add CSS-positioned labels above each gate line as an HTML overlay inside `PatientFlowCanvas.tsx`.

**Files:**
- Modify: `frontend/src/components/PatientFlow/PatientFlowCanvas.tsx`

- [ ] **Step 1: Add gate label overlay**

Inside the `containerRef` div (the Three.js canvas area), add gate labels as positioned HTML:

```tsx
{/* Gate labels — positioned above the canvas via percentage */}
<div className="absolute inset-0 pointer-events-none">
  {['Referral', 'Diagnosis · 28d', 'Decision · 31d', 'Treatment · 62d'].map((label, i) => (
    <div
      key={label}
      className="absolute top-2 text-[10px] text-gray-400 font-medium -translate-x-1/2"
      style={{ left: `${8 + (84 / 4) * i + (84 / 4) / 2}%` }}
    >
      {label}
    </div>
  ))}
</div>
```

- [ ] **Step 2: Test labels align with gate lines**

```bash
cd frontend && npm run dev
```
Visually verify the 4 labels sit above the corresponding gate regions.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PatientFlow/PatientFlowCanvas.tsx
git commit -m "feat(patient-flow): add gate stage labels as HTML overlay"
```

---

### Task 11: Bidirectional hover — highlight trust card when hovering canvas

The `onTrustHover` callback already flows up to `SearchPage`. Now ensure hovering a result card in the left panel dims other lanes in compare mode.

**Files:**
- Modify: `frontend/src/components/PatientFlow/PatientFlowCanvas.tsx`

- [ ] **Step 1: Accept highlightOds prop**

Add `highlightOds` to the Props interface (already defined but not wired). In the `PatientFlowCanvas` component, pass `highlightOds` into the animation loop to set opacity on non-highlighted lanes:

Add to Props interface if not present:
```typescript
highlightOds?: string;
```

In the `useEffect` animation setup, when `highlightOds` is set and `compareMode` is true, set all particles in non-matching lanes to 30% opacity by modifying their `aOpacity` value in the update loop.

This requires storing `highlightOds` in a ref so the animation loop can read it:

```typescript
const highlightRef = useRef<string | undefined>(highlightOds);
highlightRef.current = highlightOds;
```

Then in `ParticleSystem.update()`, if a particle's lane doesn't match the highlighted trust, multiply its opacity by 0.3.

- [ ] **Step 2: Wire highlightOds from SearchPage**

In `SearchPage.tsx`, pass `highlightOds={hoveredOds}` to `PatientFlowCanvas`:

```tsx
<PatientFlowCanvas
  results={data.results}
  onTrustHover={setHoveredOds}
  highlightOds={hoveredOds}
/>
```

- [ ] **Step 3: Test bidirectional hover**

```bash
cd frontend && npm run dev
```
- Hover a result card → that trust's lane brightens in compare mode
- Hover a gate in the canvas → corresponding card highlights in the list

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/PatientFlow/PatientFlowCanvas.tsx frontend/src/pages/SearchPage.tsx
git commit -m "feat(patient-flow): bidirectional hover highlight between list and canvas"
```

---

### Task 12: Final integration commit

- [ ] **Step 1: Run full TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```
Fix any lint errors.

- [ ] **Step 3: Test build**

```bash
cd frontend && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(patient-flow): complete particle visualization with Three.js"
```

import * as THREE from 'three';
import type { TrustLane, ParticleData } from './types.ts';
import type { LayoutResult } from './PipelineLayout.ts';
import { COLOURS, lerpColour } from './utils.ts';
import { vertexShader, fragmentShader } from './ParticleShader.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PARTICLES = 2000;
const PARTICLE_RADIUS = 0.004;
const CIRCLE_SEGMENTS = 12;

/** Base traversal time in seconds (fast particle, no bottlenecks). */
const BASE_TRAVERSE_TIME = 4.0;

/** Bottleneck zone: decelerate within this fraction of total path before gate. */
const BOTTLENECK_ZONE = 0.05;

/** Speed multiplier while bottlenecked. */
const BOTTLENECK_SPEED = 0.15;

/** Fade-in / fade-out region as fraction of total path. */
const FADE_ZONE = 0.05;

/** Proximity threshold (in progress units) for counting particles near a gate. */
const GATE_PROXIMITY = 0.03;

// ---------------------------------------------------------------------------
// Reusable objects (avoid per-frame allocations)
// ---------------------------------------------------------------------------

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();

// Zero-scale matrix written to dead particles so they are invisible.
const _zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

// ---------------------------------------------------------------------------
// Internal lane descriptor (runtime state per lane)
// ---------------------------------------------------------------------------

interface LaneRuntime {
  lane: TrustLane;
  yCenter: number;
  height: number;
  spawnInterval: number;
  timeSinceSpawn: number;
  /** Gate x-positions as progress fractions (0-1). */
  gateProgress: [number, number, number];
  /** Gate performance values in order [fds, 31d, 62d]. */
  gatePerf: [number, number, number];
}

// ---------------------------------------------------------------------------
// ParticleSystem
// ---------------------------------------------------------------------------

export class ParticleSystem {
  private scene: THREE.Scene;
  private mesh: THREE.InstancedMesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private geometry: THREE.CircleGeometry | null = null;

  // Per-instance GPU attributes
  private colourAttr: THREE.InstancedBufferAttribute | null = null;
  private opacityAttr: THREE.InstancedBufferAttribute | null = null;
  private phaseAttr: THREE.InstancedBufferAttribute | null = null;

  // CPU-side backing arrays (written each frame, then uploaded)
  private colourArray = new Float32Array(MAX_PARTICLES * 3);
  private opacityArray = new Float32Array(MAX_PARTICLES);
  private phaseArray = new Float32Array(MAX_PARTICLES);

  // Simulation state
  private particles: ParticleData[] = [];
  private laneRuntimes: LaneRuntime[] = [];
  private spawnX = 0;
  private exitX = 1;
  private pathLength = 1;

  /** Tracks highest particle index ever written, to avoid zeroing all 2000 slots each frame. */
  private highWaterMark = 0;

  // Gate x-positions in world space (used during layout computation)
  private gateXPositions: number[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initMesh();
  }

  // -----------------------------------------------------------------------
  // Initialisation
  // -----------------------------------------------------------------------

  private initMesh(): void {
    this.geometry = new THREE.CircleGeometry(PARTICLE_RADIUS, CIRCLE_SEGMENTS);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_PARTICLES);
    this.mesh.frustumCulled = false;

    // Create per-instance attributes
    this.colourAttr = new THREE.InstancedBufferAttribute(this.colourArray, 3);
    this.opacityAttr = new THREE.InstancedBufferAttribute(this.opacityArray, 1);
    this.phaseAttr = new THREE.InstancedBufferAttribute(this.phaseArray, 1);

    this.geometry.setAttribute('aColour', this.colourAttr);
    this.geometry.setAttribute('aOpacity', this.opacityAttr);
    this.geometry.setAttribute('aPhase', this.phaseAttr);

    // Initialise all instances to zero-scale (invisible)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.mesh.setMatrixAt(i, _zeroMatrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.mesh);
  }

  // -----------------------------------------------------------------------
  // Data binding
  // -----------------------------------------------------------------------

  setTrustData(lanes: TrustLane[], layout: LayoutResult): void {
    this.spawnX = layout.spawnX;
    this.exitX = layout.exitX;
    this.pathLength = this.exitX - this.spawnX;
    this.gateXPositions = layout.gates.map((g) => g.x);

    // Reset simulation
    this.particles = [];
    this.laneRuntimes = [];

    // Clear all instance matrices
    if (this.mesh) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        this.mesh.setMatrixAt(i, _zeroMatrix);
        this.opacityArray[i] = 0;
      }
      this.mesh.instanceMatrix.needsUpdate = true;
    }

    // Build per-lane runtime descriptors
    for (let li = 0; li < lanes.length; li++) {
      const trustLane = lanes[li];
      const laneLayout = layout.lanes[li];
      if (!laneLayout) continue;

      // Convert gate world-x positions to progress fractions (0-1)
      const gateProgress: [number, number, number] = [
        (this.gateXPositions[0] - this.spawnX) / this.pathLength,
        (this.gateXPositions[1] - this.spawnX) / this.pathLength,
        (this.gateXPositions[2] - this.spawnX) / this.pathLength,
      ];

      const gatePerf: [number, number, number] = [
        trustLane.gatePerformance.fds,
        trustLane.gatePerformance.thirtyOneDay,
        trustLane.gatePerformance.sixtyTwoDay,
      ];

      // Spawn interval: spread particles evenly over one traversal period
      const count = Math.max(1, trustLane.particleCount);
      const spawnInterval = BASE_TRAVERSE_TIME / count;

      this.laneRuntimes.push({
        lane: trustLane,
        yCenter: laneLayout.yCenter,
        height: laneLayout.height,
        spawnInterval,
        timeSinceSpawn: 0,
        gateProgress,
        gatePerf,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Simulation update
  // -----------------------------------------------------------------------

  update(dt: number, elapsed: number): void {
    if (!this.mesh || !this.material) return;

    // Update shader time uniform
    this.material.uniforms.uTime.value = elapsed;

    // Spawn new particles
    this.spawnParticles(dt);

    // Advance existing particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.alive) continue;
      this.advanceParticle(p, dt);
    }

    // Write GPU buffers
    this.writeBuffers();
  }

  // -----------------------------------------------------------------------
  // Spawning
  // -----------------------------------------------------------------------

  private spawnParticles(dt: number): void {
    for (const lr of this.laneRuntimes) {
      lr.timeSinceSpawn += dt;

      while (lr.timeSinceSpawn >= lr.spawnInterval) {
        lr.timeSinceSpawn -= lr.spawnInterval;

        if (this.countAlive() >= MAX_PARTICLES) break;

        this.spawnOne(lr);
      }
    }
  }

  private spawnOne(lr: LaneRuntime): void {
    // Determine fate at each gate
    const slowAtGate: [boolean, boolean, boolean] = [
      Math.random() > lr.gatePerf[0],
      Math.random() > lr.gatePerf[1],
      Math.random() > lr.gatePerf[2],
    ];

    // Slight velocity jitter for visual variety (0.85 - 1.15x)
    const baseVelocity = (1 / BASE_TRAVERSE_TIME) * (0.85 + Math.random() * 0.3);

    // Random y within the lane band
    const halfHeight = lr.height * 0.4; // 80% of lane height to avoid edges
    const y = lr.yCenter + (Math.random() * 2 - 1) * halfHeight;

    const laneIndex = this.laneRuntimes.indexOf(lr);

    const particle: ParticleData = {
      laneIndex,
      x: this.spawnX,
      y,
      baseVelocity,
      velocity: baseVelocity,
      slowAtGate,
      progress: 0,
      colourPhase: 0,
      pulsePhase: 0,
      alive: true,
      opacity: 0,
    };

    // Try to reuse a dead slot
    const deadIndex = this.findDeadSlot();
    if (deadIndex >= 0) {
      this.particles[deadIndex] = particle;
    } else if (this.particles.length < MAX_PARTICLES) {
      this.particles.push(particle);
    }
    // else: drop the spawn (shouldn't happen due to countAlive check)
  }

  private findDeadSlot(): number {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].alive) return i;
    }
    return -1;
  }

  private countAlive(): number {
    let count = 0;
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].alive) count++;
    }
    return count;
  }

  // -----------------------------------------------------------------------
  // Per-particle advancement
  // -----------------------------------------------------------------------

  private advanceParticle(p: ParticleData, dt: number): void {
    const lr = this.laneRuntimes[p.laneIndex];
    if (!lr) {
      p.alive = false;
      return;
    }

    // Determine if we're in a bottleneck zone
    let inBottleneck = false;
    let isBreached = false;

    for (let gi = 0; gi < 3; gi++) {
      if (!p.slowAtGate[gi]) continue;

      const gateP = lr.gateProgress[gi];
      const dist = gateP - p.progress;

      // Approaching gate and within bottleneck zone
      if (dist > 0 && dist < BOTTLENECK_ZONE) {
        inBottleneck = true;
      }
      // Pushing through gate (just past it, still slow)
      if (dist > -BOTTLENECK_ZONE * 0.5 && dist <= 0) {
        inBottleneck = true;
        isBreached = true;
      }
    }

    // Also mark as breached if any slowAtGate is true and we're past that gate
    if (!isBreached) {
      for (let gi = 0; gi < 3; gi++) {
        if (p.slowAtGate[gi] && p.progress > lr.gateProgress[gi]) {
          isBreached = true;
          break;
        }
      }
    }

    // Velocity
    if (inBottleneck) {
      p.velocity = p.baseVelocity * BOTTLENECK_SPEED;
    } else {
      // Smoothly recover speed after bottleneck
      p.velocity += (p.baseVelocity - p.velocity) * Math.min(1, dt * 5);
    }

    // Advance position
    const progressDelta = (p.velocity * dt) / this.pathLength;
    p.progress += progressDelta;
    p.x = this.spawnX + p.progress * this.pathLength;

    // Colour phase: 0 = spawn, 1 = on-time/breached end
    p.colourPhase = Math.min(1, p.progress);

    // Pulse phase for breached particles
    p.pulsePhase = isBreached ? p.progress * 20 : 0;

    // Opacity: fade in at start, fade out at end
    if (p.progress < FADE_ZONE) {
      p.opacity = p.progress / FADE_ZONE;
    } else if (p.progress > 1 - FADE_ZONE) {
      p.opacity = Math.max(0, (1 - p.progress) / FADE_ZONE);
    } else {
      p.opacity = 1;
    }

    // Kill particle if past exit
    if (p.progress >= 1.0) {
      p.alive = false;
      p.opacity = 0;
    }
  }

  // -----------------------------------------------------------------------
  // GPU buffer writes
  // -----------------------------------------------------------------------

  private writeBuffers(): void {
    if (!this.mesh || !this.colourAttr || !this.opacityAttr || !this.phaseAttr) return;

    const len = this.particles.length;

    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      if (!p.alive) {
        // Dead particle: zero scale matrix + zero opacity
        this.mesh.setMatrixAt(i, _zeroMatrix);
        this.opacityArray[i] = 0;
        this.phaseArray[i] = 0;
        this.colourArray[i * 3] = 0;
        this.colourArray[i * 3 + 1] = 0;
        this.colourArray[i * 3 + 2] = 0;
        continue;
      }

      // Position matrix
      _position.set(p.x, p.y, 0);
      _scale.set(1, 1, 1);
      _matrix.compose(_position, _quaternion, _scale);
      this.mesh.setMatrixAt(i, _matrix);

      // Colour
      const colour = this.computeColour(p);
      this.colourArray[i * 3] = colour[0];
      this.colourArray[i * 3 + 1] = colour[1];
      this.colourArray[i * 3 + 2] = colour[2];

      // Opacity and phase
      this.opacityArray[i] = p.opacity;
      this.phaseArray[i] = p.pulsePhase;
    }

    // Zero out slots between current length and previous high water mark.
    // This only runs when particle count shrinks (e.g. after setTrustData reset).
    for (let i = len; i < this.highWaterMark; i++) {
      this.mesh.setMatrixAt(i, _zeroMatrix);
      this.opacityArray[i] = 0;
      this.phaseArray[i] = 0;
      this.colourArray[i * 3] = 0;
      this.colourArray[i * 3 + 1] = 0;
      this.colourArray[i * 3 + 2] = 0;
    }

    this.highWaterMark = len;

    // Flag GPU uploads
    this.mesh.instanceMatrix.needsUpdate = true;
    this.colourAttr.needsUpdate = true;
    this.opacityAttr.needsUpdate = true;
    this.phaseAttr.needsUpdate = true;
  }

  private computeColour(p: ParticleData): [number, number, number] {
    const lr = this.laneRuntimes[p.laneIndex];
    if (!lr) return COLOURS.spawn;

    // Check if particle has been marked as bottlenecked at any gate
    let hasBottlenecked = false;
    for (let gi = 0; gi < 3; gi++) {
      if (p.slowAtGate[gi] && p.progress > lr.gateProgress[gi] - BOTTLENECK_ZONE) {
        hasBottlenecked = true;
        break;
      }
    }

    if (!hasBottlenecked) {
      // On-time path: blue -> green
      return lerpColour(COLOURS.spawn, COLOURS.onTime, p.colourPhase);
    }

    // Bottleneck path: determine severity
    let pastGateCount = 0;
    for (let gi = 0; gi < 3; gi++) {
      if (p.slowAtGate[gi] && p.progress > lr.gateProgress[gi]) {
        pastGateCount++;
      }
    }

    if (pastGateCount === 0) {
      // Approaching first bottleneck: blue -> amber
      return lerpColour(COLOURS.spawn, COLOURS.slowing, p.colourPhase * 2);
    }

    // Past at least one bottleneck gate: amber -> red
    const t = Math.min(1, pastGateCount / 2);
    return lerpColour(COLOURS.slowing, COLOURS.breached, t);
  }

  // -----------------------------------------------------------------------
  // Query: bottleneck counts
  // -----------------------------------------------------------------------

  getBottleneckCounts(): Map<string, number[]> {
    const result = new Map<string, number[]>();

    for (let li = 0; li < this.laneRuntimes.length; li++) {
      const lr = this.laneRuntimes[li];
      const counts = [0, 0, 0];

      for (let pi = 0; pi < this.particles.length; pi++) {
        const p = this.particles[pi];
        if (!p.alive || p.laneIndex !== li) continue;

        for (let gi = 0; gi < 3; gi++) {
          const dist = Math.abs(p.progress - lr.gateProgress[gi]);
          if (dist < GATE_PROXIMITY) {
            counts[gi]++;
          }
        }
      }

      result.set(lr.lane.odsCode, counts);
    }

    return result;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  dispose(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.dispose();
      this.mesh = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    this.colourAttr = null;
    this.opacityAttr = null;
    this.phaseAttr = null;
    this.particles = [];
    this.laneRuntimes = [];
  }
}

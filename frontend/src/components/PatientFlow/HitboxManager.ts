/**
 * HitboxManager — invisible rectangular hitboxes at each gate zone.
 *
 * We do NOT raycast individual particles (too expensive at 1000+ instances).
 * Instead we place one invisible THREE.Mesh per (gate × lane) combination and
 * raycast against those ~9–N meshes instead.
 *
 * Coordinate mapping
 * ------------------
 * PipelineLayout uses a normalised 0–1 space (x: left→right, y: top→bottom).
 * The camera is an OrthographicCamera with left=0, right=1, top=0, bottom=1,
 * so hitboxes are placed directly in normalised layout coordinates.
 */

import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Scene,
  Vector2,
} from 'three';
import type { Camera } from 'three';
import type { GateHoverData, TrustLane } from './types.ts';
import type { LayoutResult } from './PipelineLayout.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Half-width of each gate hitbox in normalised layout units (3% each side). */
const GATE_HALF_WIDTH = 0.03;

/** Maps a gate index to its gatePerformance key on TrustLane. */
const GATE_PERF_KEYS: ReadonlyArray<keyof TrustLane['gatePerformance']> = [
  'fds',
  'thirtyOneDay',
  'sixtyTwoDay',
];

// ---------------------------------------------------------------------------
// Internal bookkeeping type
// ---------------------------------------------------------------------------

interface HitboxRecord {
  mesh: Mesh;
  laneIndex: number;
  gateIndex: number;
}

// ---------------------------------------------------------------------------
// HitboxManager
// ---------------------------------------------------------------------------

export class HitboxManager {
  private readonly scene: Scene;
  private readonly raycaster: Raycaster;
  private readonly pointer: Vector2;
  private records: HitboxRecord[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
  }

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  /**
   * Create invisible hitbox meshes for every (gate, lane) pair.
   * Call this whenever the layout or lane list changes.
   */
  buildHitboxes(layout: LayoutResult, lanes: TrustLane[]): void {
    this.clear();

    // Shared invisible material — one instance is fine; meshes reference it.
    const material = new MeshBasicMaterial({ visible: false });

    // Iterate using the lanes array length so that `lanes` is read (the
    // parameter is part of the public API even though geometry only depends on
    // layout).  Both arrays must be the same length by contract.
    for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
      const laneLayout = layout.lanes[laneIdx];
      if (laneLayout === undefined) continue;

      // Hitbox dimensions in normalised layout units (camera views 0–1 directly).
      const hitHeight = laneLayout.height;
      const hitWidth  = GATE_HALF_WIDTH * 2; // half-width × 2 sides

      for (let gateIdx = 0; gateIdx < layout.gates.length; gateIdx++) {
        const gate = layout.gates[gateIdx];
        if (gate === undefined) continue;

        const geometry = new BoxGeometry(hitWidth, hitHeight, 0);
        const mesh     = new Mesh(geometry, material);

        mesh.position.set(
          gate.x,
          laneLayout.yCenter,
          0,
        );

        this.scene.add(mesh);

        this.records.push({ mesh, laneIndex: laneIdx, gateIndex: gateIdx });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Test
  // -------------------------------------------------------------------------

  /**
   * Raycast against all hitboxes and return hover data for the first hit.
   *
   * @param mouseX  Normalised device coordinate X (-1 = left, +1 = right)
   * @param mouseY  Normalised device coordinate Y (-1 = bottom, +1 = top)
   * @param camera  The active Three.js camera
   * @param lanes   Current trust lane descriptors (same order as at build time)
   * @param layout  Current layout result (used for gate label / standard lookup)
   * @returns       GateHoverData for the hit gate, or null if no hit.
   */
  test(
    mouseX: number,
    mouseY: number,
    camera: Camera,
    lanes: TrustLane[],
    layout: LayoutResult,
  ): GateHoverData | null {
    this.pointer.set(mouseX, mouseY);
    this.raycaster.setFromCamera(this.pointer, camera);

    const meshes = this.records.map((r) => r.mesh);
    const intersections = this.raycaster.intersectObjects(meshes, false);

    if (intersections.length === 0) return null;

    const hit = intersections[0];
    if (hit === undefined) return null;

    const record = this.records.find((r) => r.mesh === hit.object);
    if (record === undefined) return null;

    const { laneIndex, gateIndex } = record;

    const lane = lanes[laneIndex];
    const gate = layout.gates[gateIndex];
    if (lane === undefined || gate === undefined) return null;

    const perfKey = GATE_PERF_KEYS[gateIndex];
    if (perfKey === undefined) return null;

    const perf = lane.gatePerformance[perfKey];

    const patientsWaiting  = Math.round((1 - perf) * lane.totalPatients62d);
    const breachedPercent  = Math.round((1 - perf) * 100);

    return {
      trustOdsCode:    lane.odsCode,
      trustName:       lane.name,
      standard:        gate.standard,
      gateLabel:       gate.label,
      patientsWaiting,
      breachedPercent,
    };
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Remove all hitbox meshes from the scene and release their geometries.
   * The shared material is left alive so it can be reused if needed — it
   * contains no GPU data beyond a visibility flag.
   */
  clear(): void {
    for (const record of this.records) {
      this.scene.remove(record.mesh);
      record.mesh.geometry.dispose();
    }
    this.records = [];
  }

  /**
   * Full teardown: clear meshes, dispose the raycaster scratch vectors.
   * After calling dispose() this instance must not be reused.
   */
  dispose(): void {
    this.clear();
    // Raycaster and Vector2 hold no GPU resources; no explicit dispose needed.
    // Nulling records array signals the object is dead.
    this.records = [];
  }
}

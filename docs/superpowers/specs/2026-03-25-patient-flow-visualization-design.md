# Patient Flow Particle Visualization — Design Spec

## Overview

A Three.js particle river visualization integrated into the Inform Results page as a tab alongside the existing map. Each cohort particle (1 particle = 10 patients) flows left-to-right through the four-stage NHS cancer pathway. Particle speed and colour reflect real trust performance data — bottlenecks visibly pile up at underperforming stages, making wait time data visceral and immediate.

## Decisions

| Decision | Choice |
|----------|--------|
| Integration | Tab within Results page map panel ("Map" / "Patient Flow") |
| Particle ratio | 1 particle = 10 patients (cohort mode) |
| Pipeline stages | 4: Referral → Diagnosis (28d FDS) → Treatment Decision (31d) → Treatment (62d) |
| Default view | Single trust (top-ranked), with "Compare All" toggle for parallel lanes |
| Interaction | Hover bottleneck → tooltip + highlight result card; click → trust detail page |
| Three.js approach | Raw InstancedMesh + custom GLSL shaders (no R3F) |

## Layout & Integration

The Results page right panel gets a tab bar:

```
┌──────────────────────────┬───────────────────────────────────┐
│                          │  [ Map ]  [ Patient Flow ]        │
│  Result list (unchanged) ├───────────────────────────────────┤
│                          │  Active tab content renders here  │
│  1. Guy's & St Thomas'   │  — either Mapbox map              │
│  2. King's College       │  — or Three.js canvas             │
│  3. UCLH                 │                                   │
│  ...                     │                                   │
└──────────────────────────┴───────────────────────────────────┘
```

- Three.js canvas mounts on tab switch, unmounts when leaving (no hidden GPU work)
- Canvas fills full right panel, responsive to container resize
- Left result list unchanged — bidirectional hover linking between list and canvas

## Pipeline Stages

Four stage columns with vertical gate lines between them:

```
  REFERRAL        DIAGNOSIS         DECISION         TREATMENT
  (entry)         (28d FDS)         (31d)            (62d)
     │                │                │                │
     │    ●●●●→       │    ●●●→        │     ●●→        │    ●→  done
     │                │    ████████    │                │
     │                │   BOTTLENECK   │                │
     │                │  ●●●●●●●●●●   │                │
```

### Stage Gate Visuals
- Thin vertical line at each threshold
- Label above: stage name + standard (e.g. "Diagnosis - 28 days")
- Below pipeline: real-time count of particles bottlenecked at that gate

## Particle Behaviour

### Lifecycle
1. Particles spawn at left edge at a steady rate proportional to `total_patients / 10`
2. Each particle assigned a "fate" on spawn based on real trust performance data:
   - FDS compliance = 89% → 89% of particles clear Diagnosis gate quickly, 11% slow and pile up
   - 31D compliance = 97% → 97% clear Decision gate, 3% bottleneck
   - 62D compliance = 78% → 78% clear Treatment gate, 22% bottleneck
3. Fast particles: constant velocity, reach end in ~4 seconds
4. Slow particles: decelerate approaching gate, cluster together, eventually push through
5. Particles clearing all gates exit right edge and fade out

### Colour Progression (Per Particle)
| State | Colour | Hex |
|-------|--------|-----|
| Spawn (neutral) | Soft blue | `#60A5FA` |
| On time at gate | Green | `#22C55E` |
| Slowing down | Amber | `#F59E0B` |
| Breached standard | Red + pulse glow | `#EF4444` |

Colour transitions are continuous via GLSL lerp based on particle's time-in-stage relative to the standard threshold.

## Single Trust View (Default)

One full-width pipeline river for the top-ranked trust from search results:

```
┌─────────────────────────────────────────────────────┐
│  Guy's & St Thomas'                    Compare All ↗│
│  1,247 patients - 89% FDS - 97% 31D - 78% 62D     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Full-width Three.js particle river]               │
│                                                     │
│  ── 47,312 total days lost this month ──────────── │
└─────────────────────────────────────────────────────┘
```

- Clicking a trust card in the left panel switches the river to that trust
- Trust name + headline stats displayed as HTML overlay above canvas

## Compare All View

Toggled via "Compare All" button. Stacked horizontal lanes, one per search result trust:

```
┌─────────────────────────────────────────────────────┐
│  Compare All                          Single View ↗ │
├─────────────────────────────────────────────────────┤
│  Guy's & St Thomas' (89% FDS)                       │
│  ●●●●→ ─│─ ●●●→ ─│─ ●●→ ─│─ ●→                    │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  King's College (84% FDS)                           │
│  ●●●●→ ─│─ ●●●→ ─│─ ██●→ ─│─ ●→                   │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  UCLH (81% FDS)                                    │
│  ●●●●→ ─│─ ●●●→ ─│─ ████→ ─│─ █●→                 │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  ── 47,312 total days lost ─────────────────────── │
└─────────────────────────────────────────────────────┘
```

- Stage gate columns stay vertically aligned across all lanes for scanability
- Scrollable if more than ~5 trusts
- Clicking a lane expands to single-trust full view
- Hovering a trust card in the left panel brightens that lane, dims others to 30% opacity

## Interaction

### Hover Bottleneck (Canvas)
Tooltip near cursor:
```
┌──────────────────────────────┐
│ Diagnosis gate - 28-day FDS  │
│ 142 patients waiting         │
│ 11% breached standard        │
│ Avg wait: 34 days            │
└──────────────────────────────┘
```
Simultaneously highlights the corresponding trust card in the left result list and pulses the relevant metric (FDS/31D/62D).

### Click Bottleneck
Navigates to Trust Detail page (`/trust/:odsCode`) with the relevant standard pre-selected.

### Hover Trust Card (Left Panel)
In compare mode: that trust's lane brightens, all others dim to 30% opacity.

### Raycasting Strategy
- Do NOT raycast individual particles (too expensive at 1,000+ instances)
- Define invisible hitbox rectangles at each gate zone per trust (4 gates x N trusts)
- Raycast against hitbox rectangles only
- On hit: read gate index + trust ID, look up stats for tooltip

## "Days Lost" Counter

Fixed bar at bottom of canvas (HTML overlay, not rendered in Three.js):

- Computes: `SUM(breached_patients x days_over_standard)` across all visible trusts
- Animates with counting-up effect on load
- Ticks up in real-time (extrapolated: `monthly_total / days_in_month / 86400 x elapsed_seconds`)
- White monospace number on dark semi-transparent bar

## Three.js Architecture

### File Structure
```
src/
├── components/
│   └── PatientFlow/
│       ├── PatientFlowCanvas.tsx    — React wrapper: mounts renderer, handles resize/cleanup
│       ├── ParticleSystem.ts        — InstancedMesh setup, buffer attributes, spawn/update loop
│       ├── PipelineLayout.ts        — computes gate positions, lane heights for N trusts
│       ├── ParticleShader.ts        — vertex + fragment GLSL (colour gradient, pulse glow)
│       ├── HitboxManager.ts         — invisible hitbox meshes at gates, raycaster logic
│       ├── DaysLostCounter.ts       — bottom bar HUD (HTML overlay)
│       ├── types.ts                 — ParticleData, TrustLane, GateStats interfaces
│       └── utils.ts                 — fate assignment from performance data, colour lerp
```

### ParticleSystem (Core Engine)
- Creates one `THREE.InstancedMesh` with small circle geometry (8-segment ring)
- Per-instance buffer attributes:
  - `aPosition` (vec3) — current position
  - `aColour` (vec3) — current RGB
  - `aOpacity` (float) — for spawn/despawn fade
  - `aPhase` (float) — pulse phase for breached particles
- On each `requestAnimationFrame`:
  - Update positions based on velocity per particle
  - Check gate thresholds, apply deceleration for slow-fate particles
  - Reassign colours via lerp
  - Handle spawn (left edge) and despawn (right edge fade)
- Exposes `setTrustData(trusts: TrustLane[])` to switch between single/compare mode

### ParticleShader (GLSL)
- **Vertex shader:** Reads instance attributes, positions particle, scales point size
- **Fragment shader:**
  - Soft circle with radial alpha falloff
  - Colour from `aColour` attribute
  - Alpha from `aOpacity` attribute
  - Additive glow when `aPhase > 0.0`: `glow = sin(uTime * 3.0 + aPhase) * 0.3 + 0.7`
  - Time uniform (`uTime`) passed each frame for pulse animation

### PatientFlowCanvas.tsx (React Wrapper)
- Receives props: `searchResults`, `selectedTrust`, `onTrustHover(odsCode)`, `onGateClick(odsCode, standard)`
- On mount: creates `THREE.Scene`, `THREE.OrthographicCamera` (2D feel), `THREE.WebGLRenderer`
- Passes data into `ParticleSystem` and `PipelineLayout`
- On unmount: disposes all GPU resources (geometries, materials, textures)
- Forwards mouse events to `HitboxManager`
- Emits hover/click callbacks to parent component

### PipelineLayout
- Input: canvas width, canvas height, number of trusts, single vs compare mode
- Output: x-coordinates for each gate line, y-center and height for each trust lane
- Recomputes on resize or mode toggle

### HitboxManager
- Creates invisible `THREE.Mesh` rectangles at each gate zone
- On mousemove: performs `THREE.Raycaster` intersection test against hitboxes
- Returns `{ trustOdsCode, standard, gateIndex }` or null
- On click: emits gate click event

## Data Contract

The visualization reads from the existing API:

| Endpoint | Data Used |
|----------|-----------|
| `POST /api/search` | `trust.ods_code`, `trust.name`, `scores.fds`, `scores.31d`, `scores.62d`, `total_patients` |
| `GET /api/stats/:odsCode` | Monthly trend (for "days lost" computation, breach counts) |

### TrustLane Interface
```typescript
interface TrustLane {
  odsCode: string;
  name: string;
  totalPatients: number;       // raw count from data
  particleCount: number;       // totalPatients / 10
  gatePerformance: {
    fds: number;               // 0-1, e.g. 0.89
    thirtyOneDay: number;      // 0-1
    sixtyTwoDay: number;       // 0-1
  };
  breachedPatients: number;    // for days-lost counter
  avgDaysOverStandard: number; // for days-lost counter
}
```

## Performance Budget

| Metric | Target |
|--------|--------|
| Max particles | ~1,500 (10 trusts x 150 avg in compare mode) |
| Draw calls | 1 (single InstancedMesh) |
| Frame rate | 60fps on integrated GPU (MacBook Air tier) |
| Shader complexity | Minimal — no lighting, no shadows, no post-processing |
| Memory | < 50MB GPU allocation |

## Responsive Behaviour

| Breakpoint | Behaviour |
|-----------|-----------|
| >= 1024px | Tab bar + full canvas in right panel |
| 768-1023px | Canvas stacks below result list, full width |
| < 768px | "Patient Flow" tab shows canvas full-screen with back button overlay |

## Error States

- **No data**: Show empty pipeline skeleton with message "No patient flow data available for this cancer type"
- **Single trust with 0 patients**: Skip lane in compare view, show note
- **WebGL not supported**: Fall back to static bar chart of the same data (graceful degradation)
- **API error**: Show retry prompt in the canvas area

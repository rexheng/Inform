import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import type { SearchResult } from '../../api/client';
import type { GateHoverData, TrustLane } from './types';
import { searchResultsToLanes, totalDaysLost } from './utils';
import { computeLayout } from './PipelineLayout';
import type { LayoutResult } from './PipelineLayout';
import { ParticleSystem } from './ParticleSystem';
import { HitboxManager } from './HitboxManager';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  results: SearchResult[];
  selectedTrust?: string;
  highlightOds?: string;
  onTrustHover?: (odsCode: string | undefined) => void;
  onGateClick?: (odsCode: string, standard: string) => void;
}

// ---------------------------------------------------------------------------
// Gate stage labels and their horizontal positions (fraction of container)
// ---------------------------------------------------------------------------

const STAGE_LABELS: { label: string; left: string }[] = [
  { label: 'Referral',           left: '8%'  },
  { label: 'Diagnosis \u00b7 28d', left: '29%' },
  { label: 'Decision \u00b7 31d',  left: '50%' },
  { label: 'Treatment \u00b7 62d', left: '71%' },
];

// ---------------------------------------------------------------------------
// WebGL support check
// ---------------------------------------------------------------------------

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') || canvas.getContext('webgl')
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PatientFlowCanvas({
  results,
  selectedTrust,
  highlightOds: _highlightOds,
  onTrustHover,
  onGateClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ---- State ----
  const [compareMode, setCompareMode] = useState(false);
  const [hoverData, setHoverData] = useState<GateHoverData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [displayedDaysLost, setDisplayedDaysLost] = useState(0);

  // Determine the active trust (single mode focuses on selectedTrust or first result)
  const activeTrust = useMemo(() => {
    if (compareMode) return undefined;
    if (selectedTrust) return selectedTrust;
    return results[0]?.ods_code;
  }, [compareMode, selectedTrust, results]);

  // Filter results for single-trust mode
  const activeResults = useMemo(() => {
    if (compareMode) return results;
    if (!activeTrust) return results;
    const match = results.find((r) => r.ods_code === activeTrust);
    return match ? [match] : results;
  }, [compareMode, activeTrust, results]);

  // Compute lanes and layout
  const lanes = useMemo(
    () => searchResultsToLanes(activeResults, compareMode),
    [activeResults, compareMode],
  );

  const layout = useMemo(
    () => computeLayout(lanes.length, compareMode, lanes.map((l) => l.odsCode)),
    [lanes, compareMode],
  );

  const targetDaysLost = useMemo(() => totalDaysLost(lanes), [lanes]);

  // ---- Animated days-lost counter ----
  useEffect(() => {
    if (targetDaysLost === 0) {
      setDisplayedDaysLost(0);
      return;
    }

    const duration = 1200; // ms
    const start = performance.now();
    const from = 0;
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedDaysLost(Math.round(from + (targetDaysLost - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetDaysLost]);

  // ---- Refs for Three.js objects (stable across renders) ----
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    particleSystem: ParticleSystem;
    hitboxManager: HitboxManager;
    clock: THREE.Clock;
    animFrameId: number;
    lanes: TrustLane[];
    layout: LayoutResult;
  } | null>(null);

  // Keep lanes/layout in sync with the Three.js ref so event handlers can read them
  useEffect(() => {
    if (threeRef.current) {
      threeRef.current.lanes = lanes;
      threeRef.current.layout = layout;
    }
  }, [lanes, layout]);

  // ---- Mouse → NDC helper (returns NDC x,y for raycaster) ----
  const mouseToNDC = useCallback(
    (clientX: number, clientY: number): { ndcX: number; ndcY: number } | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return { ndcX: x, ndcY: y };
    },
    [],
  );

  // ---- Hitbox test (shared by mousemove and click) ----
  const runHitTest = useCallback(
    (clientX: number, clientY: number): GateHoverData | null => {
      const ctx = threeRef.current;
      if (!ctx) return null;
      const ndc = mouseToNDC(clientX, clientY);
      if (!ndc) return null;
      return ctx.hitboxManager.test(
        ndc.ndcX,
        ndc.ndcY,
        ctx.camera,
        ctx.lanes,
        ctx.layout,
      );
    },
    [mouseToNDC],
  );

  // ---- Mouse event handlers ----
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const hit = runHitTest(e.clientX, e.clientY);
      setHoverData(hit);
      setTooltipPos({ x: e.clientX, y: e.clientY });
      onTrustHover?.(hit?.trustOdsCode);
    },
    [runHitTest, onTrustHover],
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      // CRITICAL: re-run hitbox test on click to avoid stale closure over hoverData
      const hit = runHitTest(e.clientX, e.clientY);
      if (!hit) return;
      if (onGateClick) {
        onGateClick(hit.trustOdsCode, hit.standard);
      } else {
        navigate(`/provider/${hit.trustOdsCode}`);
      }
    },
    [runHitTest, onGateClick, navigate],
  );

  // ---- Three.js lifecycle ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container || results.length === 0 || !supportsWebGL()) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb);

    // Camera: views normalised 0-1 space directly. top=0, bottom=1 matches
    // PipelineLayout's y-axis convention (y grows downward).
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Systems
    const particleSystem = new ParticleSystem(scene);
    const hitboxManager = new HitboxManager(scene);
    const clock = new THREE.Clock();

    particleSystem.setTrustData(lanes, layout);
    hitboxManager.buildHitboxes(layout, lanes);

    // Store ref
    threeRef.current = {
      scene,
      camera,
      renderer,
      particleSystem,
      hitboxManager,
      clock,
      animFrameId: 0,
      lanes,
      layout,
    };

    // Animation loop
    function animate() {
      const ctx = threeRef.current;
      if (!ctx) return;
      ctx.animFrameId = requestAnimationFrame(animate);
      const dt = ctx.clock.getDelta();
      const elapsed = ctx.clock.getElapsedTime();
      ctx.particleSystem.update(dt, elapsed);
      ctx.renderer.render(ctx.scene, ctx.camera);
    }
    animate();

    // Mouse events
    const canvas = renderer.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const ctx = threeRef.current;
      if (!ctx) return;
      const { width: w, height: h } = entry.contentRect;
      if (w === 0 || h === 0) return;
      ctx.renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      const ctx = threeRef.current;
      if (ctx) {
        cancelAnimationFrame(ctx.animFrameId);
        ctx.particleSystem.dispose();
        ctx.hitboxManager.dispose();
        ctx.renderer.dispose();
        if (ctx.renderer.domElement.parentNode) {
          ctx.renderer.domElement.parentNode.removeChild(ctx.renderer.domElement);
        }
      }
      threeRef.current = null;

      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);

      resizeObserver.disconnect();
    };
    // Full remount on these changes is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode, activeTrust, results]);

  // ---- When lanes/layout change but effect hasn't re-run, push new data ----
  useEffect(() => {
    const ctx = threeRef.current;
    if (!ctx) return;
    ctx.particleSystem.setTrustData(lanes, layout);
    ctx.hitboxManager.buildHitboxes(layout, lanes);
  }, [lanes, layout]);

  // ---- Active trust info for header ----
  const activeLane = lanes.length === 1 ? lanes[0] : undefined;

  // ---- Render ----

  // WebGL fallback
  if (!supportsWebGL()) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
        WebGL is not supported in this browser. Patient flow visualization requires a WebGL-capable browser.
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
        No patient flow data available
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f9fafb] relative">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {!compareMode && activeLane ? (
            <>
              <span className="text-sm font-semibold text-gray-900">{activeLane.name}</span>
              <span className="text-xs text-gray-400">
                {activeLane.totalPatients62d.toLocaleString()} patients
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-900">
              All trusts ({lanes.length})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCompareMode((prev) => !prev)}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#4a8c7f] hover:text-[#4a8c7f] transition-colors"
        >
          {compareMode ? 'Single trust' : 'Compare all'}
        </button>
      </div>

      {/* Gate stage labels */}
      <div className="relative h-6 shrink-0">
        {STAGE_LABELS.map(({ label, left }) => (
          <span
            key={label}
            className="absolute top-1 text-[10px] text-gray-400 -translate-x-1/2 whitespace-nowrap select-none"
            style={{ left }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Three.js canvas container */}
      <div ref={containerRef} className="flex-1 relative min-h-0" />

      {/* Days lost counter */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-800 text-white">
        <span className="font-mono text-lg font-bold tracking-tight tabular-nums">
          {displayedDaysLost.toLocaleString()}
        </span>
        <span className="text-xs text-gray-400">
          estimated days lost &middot; derived from monthly data
        </span>
      </div>

      {/* Tooltip */}
      {hoverData && (
        <div
          className="fixed z-50 pointer-events-none bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-3 text-sm"
          style={{
            left: tooltipPos.x + 14,
            top: tooltipPos.y - 10,
          }}
        >
          <div className="font-semibold text-gray-900 mb-1">{hoverData.trustName}</div>
          <div className="text-gray-500 text-xs mb-1.5">{hoverData.gateLabel}</div>
          <div className="flex gap-4 text-xs">
            <span>
              <span className="text-gray-400">Waiting: </span>
              <span className="font-medium text-gray-700">{hoverData.patientsWaiting}</span>
            </span>
            <span>
              <span className="text-gray-400">Breached: </span>
              <span className="font-medium text-red-500">{hoverData.breachedPercent}%</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

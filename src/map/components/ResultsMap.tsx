'use client';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { Trust, Condition } from '@/lib/types';
import 'leaflet/dist/leaflet.css';

interface TrustMapProps {
  trusts: Trust[];
  condition: Condition;
}

function FitBounds({ trusts }: { trusts: Trust[] }) {
  const map = useMap();
  useEffect(() => {
    if (trusts.length === 0) return;
    const points: [number, number][] = trusts.map(t => [t.lat, t.lng]);
    map.fitBounds(points, { padding: [50, 50] });
  }, [trusts, map]);
  return null;
}

function getWaitColor(weeks: number, minWeeks: number, maxWeeks: number): string {
  if (maxWeeks === minWeeks) return '#22c55e';
  const t = (weeks - minWeeks) / (maxWeeks - minWeeks);
  // Green (#22c55e) → Yellow (#eab308) → Red (#ef4444)
  if (t <= 0.5) {
    const p = t * 2;
    const r = Math.round(0x22 + (0xea - 0x22) * p);
    const g = Math.round(0xc5 + (0xb3 - 0xc5) * p);
    const b = Math.round(0x5e + (0x08 - 0x5e) * p);
    return `rgb(${r},${g},${b})`;
  } else {
    const p = (t - 0.5) * 2;
    const r = Math.round(0xea + (0xef - 0xea) * p);
    const g = Math.round(0xb3 + (0x44 - 0xb3) * p);
    const b = Math.round(0x08 + (0x44 - 0x08) * p);
    return `rgb(${r},${g},${b})`;
  }
}

export function TrustMap({ trusts, condition }: TrustMapProps) {
  const { min, max } = useMemo(() => {
    const waits = trusts.map(t => t.waits[condition]);
    return { min: Math.min(...waits), max: Math.max(...waits) };
  }, [trusts, condition]);

  return (
    <MapContainer center={[51.5074, -0.1278]} zoom={11} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {trusts.map(trust => {
        const weeks = trust.waits[condition];
        const days = weeks * 7;
        const color = getWaitColor(weeks, min, max);
        return (
          <CircleMarker
            key={trust.code}
            center={[trust.lat, trust.lng]}
            radius={12}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.85,
              color: '#FFFFFF',
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold text-cp-dark text-[14px] leading-snug">{trust.name}</div>
                <div className="text-cp-text-muted text-[12px] mt-0.5">{trust.borough}</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-[24px] font-extrabold leading-none" style={{ color }}>{days}</span>
                  <span className="text-[12px] text-cp-text-muted mb-0.5">days avg wait</span>
                </div>
                <div className="mt-1.5 text-[11px]">
                  {days <= 28 ? (
                    <span className="text-green-600 font-semibold">Within 28-day target</span>
                  ) : (
                    <span className="text-red-500 font-semibold">{days - 28} days over target</span>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      <FitBounds trusts={trusts} />
    </MapContainer>
  );
}

// Keep the old export for backwards compat with provider detail page if needed
export { TrustMap as ResultsMap };

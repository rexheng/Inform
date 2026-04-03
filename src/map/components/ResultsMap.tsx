'use client';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { Trust, Condition } from '@/lib/types';
import type { SearchResult } from '../types';
import 'leaflet/dist/leaflet.css';

/* ── Live user location marker ── */

function UserLocationMarker() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Silently fail — location is optional enhancement
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  if (!position) return null;

  return (
    <>
      {/* Pulsing outer ring */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={18}
        pathOptions={{ fillColor: '#0A3B2A', fillOpacity: 0.12, color: '#0A3B2A', weight: 1, opacity: 0.3 }}
      />
      {/* Solid inner dot */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={7}
        pathOptions={{ fillColor: '#0A3B2A', fillOpacity: 1, color: '#D9FA58', weight: 2.5 }}
      >
        <Popup>
          <div className="font-semibold text-[13px]">Your location</div>
        </Popup>
      </CircleMarker>
    </>
  );
}

/* ── Trust heatmap (used by /map page) ── */

interface TrustMapProps {
  trusts: Trust[];
  condition: Condition;
}

function FitBoundsTrusts({ trusts }: { trusts: Trust[] }) {
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
      <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {trusts.map(trust => {
        const weeks = trust.waits[condition];
        const days = weeks * 7;
        const color = getWaitColor(weeks, min, max);
        return (
          <CircleMarker key={trust.code} center={[trust.lat, trust.lng]} radius={12} pathOptions={{ fillColor: color, fillOpacity: 0.85, color: '#FFFFFF', weight: 2 }}>
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold text-[14px] leading-snug">{trust.name}</div>
                <div className="text-gray-500 text-[12px] mt-0.5">{trust.borough}</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-[24px] font-extrabold leading-none" style={{ color }}>{days}</span>
                  <span className="text-[12px] text-gray-500 mb-0.5">days avg wait</span>
                </div>
                <div className="mt-1.5 text-[11px]">
                  {days <= 28 ? (
                    <span className="text-green-600 font-semibold">Within 28-day target</span>
                  ) : (
                    <span className="text-red-500 font-semibold">{days - 28} days over target</span>
                  )}
                </div>
                <a href={`/map/trust/${trust.code}?condition=${condition}`} className="mt-2 block text-[12px] font-bold text-[#0A3B2A] hover:underline">View details &rarr;</a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      <UserLocationMarker />
      <FitBoundsTrusts trusts={trusts} />
    </MapContainer>
  );
}

/* ── Search results map (used by provider search) ── */

interface ResultsProps {
  results: SearchResult[];
  userLocation?: { lat: number; lng: number };
  highlightOds?: string;
}

function getMarkerColor(perf: number | null): string {
  if (perf === null || perf === undefined) return '#537566';
  if (perf >= 0.85) return '#0A3B2A';
  if (perf >= 0.75) return '#A3E4D1';
  if (perf >= 0.60) return '#D0A4FF';
  return '#ef4444';
}

function perfToAvgDays(perf: number | null, std: number): string {
  if (!perf || perf === 0) return '\u2014';
  return String(Math.round(std * (2 - perf) / 2));
}

function FitBoundsResults({ results, userLocation }: { results: SearchResult[]; userLocation?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    results.forEach(r => { if (r.lat && r.lng) points.push([r.lat, r.lng]); });
    if (points.length >= 2) map.fitBounds(points, { padding: [40, 40] });
    else if (points.length === 1) map.setView(points[0], 14);
  }, [results, userLocation, map]);
  return null;
}

export function ResultsMap({ results, userLocation, highlightOds }: ResultsProps) {
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [51.5144, -0.1165];
  return (
    <MapContainer center={center} zoom={11} className="h-full w-full" zoomControl={false}>
      <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {userLocation && (
        <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} pathOptions={{ fillColor: '#0A3B2A', fillOpacity: 1, color: '#D9FA58', weight: 2 }}>
          <Popup>Your location</Popup>
        </CircleMarker>
      )}
      {results.map(r => (
        <CircleMarker key={r.ods_code} center={[r.lat, r.lng]} radius={r.ods_code === highlightOds ? 10 : 7} pathOptions={{ fillColor: getMarkerColor(r.performance_fds), fillOpacity: r.ods_code === highlightOds ? 1 : 0.7, color: r.ods_code === highlightOds ? '#0A3B2A' : '#FFFFFF', weight: r.ods_code === highlightOds ? 2 : 1 }}>
          <Popup>
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-gray-500 mt-1">{perfToAvgDays(r.performance_fds, 28)} days avg wait</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      <FitBoundsResults results={results} userLocation={userLocation} />
    </MapContainer>
  );
}

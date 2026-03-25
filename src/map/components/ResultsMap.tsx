'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { SearchResult } from '../types';
import 'leaflet/dist/leaflet.css';

interface Props {
  results: SearchResult[];
  userLocation?: { lat: number; lng: number };
  highlightOds?: string;
}

function FitBounds({ results, userLocation }: Omit<Props, 'highlightOds'>) {
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

function getMarkerColor(perf: number | null): string {
  if (perf === null || perf === undefined) return '#537566';
  if (perf >= 0.85) return '#0A3B2A';
  if (perf >= 0.75) return '#A3E4D1';
  if (perf >= 0.60) return '#D0A4FF';
  return '#ef4444';
}

function perfToAvgDays(perf: number | null, std: number): string {
  if (!perf || perf === 0) return '—';
  return String(Math.round(std * (2 - perf) / 2));
}

export function ResultsMap({ results, userLocation, highlightOds }: Props) {
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
              <div className="font-semibold text-cp-dark">{r.name}</div>
              <div className="text-cp-text-muted mt-1">{perfToAvgDays(r.performance_fds, 28)} days avg wait</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      <FitBounds results={results} userLocation={userLocation} />
    </MapContainer>
  );
}

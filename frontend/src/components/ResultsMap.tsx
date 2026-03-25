import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { SearchResult } from '../api/client';
import { trustInfo } from '../data/trustInfo';
import 'leaflet/dist/leaflet.css';

interface Props {
  results: SearchResult[];
  userLocation?: { lat: number; lng: number };
  highlightOds?: string;
}

// LSE hardcoded location
const LSE_LOCATION: [number, number] = [51.5144, -0.1165];

function FitBounds({ results }: Omit<Props, 'highlightOds'>) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [LSE_LOCATION];
    results.forEach(r => {
      if (r.lat && r.lng) points.push([r.lat, r.lng]);
    });

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40] });
    } else {
      map.setView(LSE_LOCATION, 14);
    }
  }, [results, map]);

  return null;
}

function getMarkerColor(perf: number | null): string {
  if (perf === null || perf === undefined) return '#537566'; // cp-text-muted
  if (perf >= 0.85) return '#0A3B2A'; // cp-dark — good
  if (perf >= 0.75) return '#A3E4D1'; // cp-mint — acceptable
  if (perf >= 0.60) return '#D0A4FF'; // cp-purple — delays
  return '#ef4444'; // red — significant delays
}

function perfToAvgDays(perf: number | null, std: number): string {
  if (!perf || perf === 0) return '—';
  return String(Math.round(std * (2 - perf) / 2));
}

function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

function perfLabel(perf: number | null): { text: string; color: string } {
  if (perf === null || perf === undefined) return { text: 'No data', color: '#537566' };
  const pct = Math.round(perf * 100);
  if (pct >= 85) return { text: 'Good', color: '#0A3B2A' };
  if (pct >= 75) return { text: 'OK', color: '#d97706' };
  if (pct >= 60) return { text: 'Longer waits', color: '#f97316' };
  return { text: 'Long waits', color: '#ef4444' };
}

const pulsingIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:40px;height:40px;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:#0A3B2A;border:2.5px solid #D9FA58;border-radius:50%;z-index:2;box-shadow:0 0 6px rgba(10,59,42,0.4);"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:rgba(217,250,88,0.35);border-radius:50%;z-index:1;animation:cp-pulse 2s ease-out infinite;"></div>
      <style>@keyframes cp-pulse{0%{width:12px;height:12px;opacity:1}100%{width:40px;height:40px;opacity:0}}</style>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export function ResultsMap({ results, userLocation, highlightOds }: Props) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : LSE_LOCATION;

  return (
    <MapContainer center={center} zoom={11} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Pulsing location indicator — hardcoded to LSE */}
      <Marker position={LSE_LOCATION} icon={pulsingIcon}>
        <Popup>
          <div style={{fontFamily:'system-ui,sans-serif',minWidth:140}}>
            <div style={{fontWeight:700,fontSize:13,color:'#0A3B2A'}}>Your location</div>
            <div style={{fontSize:12,color:'#537566',marginTop:2}}>London School of Economics</div>
          </div>
        </Popup>
      </Marker>

      {/* Provider markers */}
      {results.map(r => {
        const rating = perfLabel(r.performance_fds);
        const contact = trustInfo[r.ods_code];
        return (
          <CircleMarker
            key={r.ods_code}
            center={[r.lat, r.lng]}
            radius={r.ods_code === highlightOds ? 10 : 7}
            pathOptions={{
              fillColor: getMarkerColor(r.performance_fds),
              fillOpacity: r.ods_code === highlightOds ? 1 : 0.7,
              color: r.ods_code === highlightOds ? '#0A3B2A' : '#FFFFFF',
              weight: r.ods_code === highlightOds ? 2 : 1,
            }}
          >
            <Popup>
              <div style={{fontFamily:'system-ui,sans-serif',minWidth:200,maxWidth:260}}>
                <div style={{fontWeight:700,fontSize:14,color:'#0A3B2A',lineHeight:'1.3'}}>{r.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <span style={{fontSize:24,fontWeight:800,color:'#0A3B2A',letterSpacing:'-0.03em',lineHeight:1}}>
                    {perfToAvgDays(r.performance_fds, 28)}
                  </span>
                  <span style={{fontSize:12,color:'#537566'}}>days avg wait</span>
                  <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,color:rating.color,background:rating.color+'18',padding:'2px 8px',borderRadius:99}}>
                    {rating.text}
                  </span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10,paddingTop:10,borderTop:'1px solid #e0e5e3'}}>
                  <a
                    href={directionsUrl(r.lat, r.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:99,background:'#0A3B2A',color:'#fff',fontSize:11,fontWeight:700,textDecoration:'none'}}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    Directions
                  </a>
                  <a
                    href={`/provider/${r.ods_code}`}
                    style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:99,border:'1.5px solid #0A3B2A',color:'#0A3B2A',fontSize:11,fontWeight:700,textDecoration:'none',background:'transparent'}}
                  >
                    View details →
                  </a>
                </div>
                {contact && (
                  <div style={{display:'flex',gap:10,marginTop:8,fontSize:11,color:'#537566'}}>
                    <a href={`tel:${contact.phone.replace(/\s/g,'')}`} style={{color:'#0A3B2A',fontWeight:600,textDecoration:'none'}}>
                      {contact.phone}
                    </a>
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" style={{color:'#537566',textDecoration:'underline'}}>
                      Website
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      <FitBounds results={results} />
    </MapContainer>
  );
}

import { useState } from 'react';
import { useCancerTypes } from '../hooks/useCancerTypes';
import type { SearchParams } from '../api/client';

interface Props {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
  onGpsLocation?: (coords: { lat: number; lng: number } | null) => void;
}

export function SearchForm({ onSearch, loading, onGpsLocation }: Props) {
  const { types, loading: typesLoading } = useCancerTypes();
  const [cancerType, setCancerType] = useState('');
  const [postcode, setPostcode] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancerType) return;

    if (gpsActive && gpsCoords) {
      onSearch({ cancerType, lat: gpsCoords.lat, lng: gpsCoords.lng });
    } else if (postcode.trim()) {
      onSearch({ cancerType, postcode: postcode.trim() });
    }
  };

  const handleGps = () => {
    if (gpsActive) {
      setGpsActive(false);
      setGpsCoords(null);
      setGpsError(null);
      onGpsLocation?.(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsCoords(coords);
        setGpsActive(true);
        setLocating(false);
        onGpsLocation?.(coords);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? 'Location access denied. Please enter a postcode instead.'
            : 'Could not determine your location. Please enter a postcode.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const canSubmit = cancerType && (gpsActive ? !!gpsCoords : !!postcode.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="cancer-type"
          className="block text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70 mb-2"
        >
          Condition / Pathway
        </label>
        <select
          id="cancer-type"
          value={cancerType}
          onChange={e => setCancerType(e.target.value)}
          className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-cp-dark text-[15px] focus:border-cp-dark focus:outline-none appearance-none cursor-pointer"
          disabled={typesLoading}
        >
          <option value="">Select a cancer type...</option>
          {types.map(t => (
            <option key={t.value} value={t.value}>
              {t.display_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-cp-dark opacity-70 mb-2"
        >
          Your Location
        </label>

        {/* GPS toggle */}
        <button
          type="button"
          onClick={handleGps}
          disabled={locating}
          className={`flex items-center gap-2 mb-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-colors w-full border-[1.5px] ${
            gpsActive
              ? 'bg-cp-mint/20 text-cp-dark border-cp-mint'
              : 'bg-white text-cp-text-muted border-cp-border hover:border-cp-dark'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
          {locating ? 'Locating...' : gpsActive ? 'Using your GPS location' : 'Use my current location'}
        </button>

        {gpsError && (
          <p className="text-[12px] text-red-500 mb-2">{gpsError}</p>
        )}

        {/* Postcode fallback */}
        {!gpsActive && (
          <input
            id="postcode"
            type="text"
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            placeholder="Or enter a postcode, e.g. E8 2DS"
            className="w-full rounded-2xl border-[1.5px] border-cp-border bg-white px-4 py-3 text-cp-dark text-[15px] placeholder-cp-text-muted/50 focus:border-cp-dark focus:outline-none"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full bg-cp-dark text-white rounded-full py-4 font-bold text-sm tracking-wide flex items-center justify-between px-6 disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:opacity-90"
      >
        <span>{loading ? 'Searching...' : 'Find Nearest Hospitals'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}

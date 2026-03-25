import { useState } from 'react';
import { useCancerTypes } from '../hooks/useCancerTypes';
import type { SearchParams } from '../api/client';

interface Props {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
}

export function SearchForm({ onSearch, loading }: Props) {
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
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsActive(true);
        setLocating(false);
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
          className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-2"
        >
          Condition / Pathway
        </label>
        <select
          id="cancer-type"
          value={cancerType}
          onChange={e => setCancerType(e.target.value)}
          className="w-full bg-transparent border-b border-gray-300 pb-2 text-gray-900 text-[15px] focus:border-gray-500 focus:outline-none appearance-none cursor-pointer"
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
          className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-2"
        >
          Your Location
        </label>

        {/* GPS toggle */}
        <button
          type="button"
          onClick={handleGps}
          disabled={locating}
          className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors w-full ${
            gpsActive
              ? 'bg-[#4a8c7f]/10 text-[#4a8c7f] border border-[#4a8c7f]/30'
              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="w-full bg-transparent border-b border-gray-300 pb-2 text-gray-900 text-[15px] placeholder-gray-300 focus:border-gray-500 focus:outline-none"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full rounded-md py-3 text-white text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ backgroundColor: loading ? '#7fb3a8' : '#4a8c7f' }}
        onMouseEnter={e => !loading && ((e.target as HTMLElement).style.backgroundColor = '#3d7568')}
        onMouseLeave={e => !loading && ((e.target as HTMLElement).style.backgroundColor = '#4a8c7f')}
      >
        {loading ? 'Searching...' : 'Find Nearest Hospitals'}
      </button>
    </form>
  );
}

import { useState } from 'react';
import { useCancerTypes } from '../hooks/useCancerTypes';

interface Props {
  onSearch: (cancerType: string, postcode: string) => void;
  loading?: boolean;
}

export function SearchForm({ onSearch, loading }: Props) {
  const { types, loading: typesLoading } = useCancerTypes();
  const [cancerType, setCancerType] = useState('');
  const [postcode, setPostcode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cancerType && postcode.trim()) {
      onSearch(cancerType, postcode.trim());
    }
  };

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
          htmlFor="postcode"
          className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-400 mb-2"
        >
          Your Location
        </label>
        <input
          id="postcode"
          type="text"
          value={postcode}
          onChange={e => setPostcode(e.target.value)}
          placeholder="E8 2DS"
          className="w-full bg-transparent border-b border-gray-300 pb-2 text-gray-900 text-[15px] placeholder-gray-300 focus:border-gray-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !cancerType || !postcode.trim()}
        className="w-full rounded-md py-3 text-white text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ backgroundColor: loading ? '#7fb3a8' : '#4a8c7f' }}
        onMouseEnter={e => !loading && ((e.target as HTMLElement).style.backgroundColor = '#3d7568')}
        onMouseLeave={e => !loading && ((e.target as HTMLElement).style.backgroundColor = '#4a8c7f')}
      >
        {loading ? 'Searching...' : 'Update Results'}
      </button>
    </form>
  );
}

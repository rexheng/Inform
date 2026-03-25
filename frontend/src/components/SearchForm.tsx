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
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4">
      <div>
        <label htmlFor="cancer-type" className="block text-sm font-medium text-gray-700 mb-1">
          Cancer Type
        </label>
        <select
          id="cancer-type"
          value={cancerType}
          onChange={e => setCancerType(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
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
        <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
          Your Postcode
        </label>
        <input
          id="postcode"
          type="text"
          value={postcode}
          onChange={e => setPostcode(e.target.value)}
          placeholder="e.g. SE1 7EH"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !cancerType || !postcode.trim()}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Searching...' : 'Find Nearest Providers'}
      </button>
    </form>
  );
}

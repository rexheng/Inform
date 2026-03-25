import { useState, useEffect } from 'react';
import { api, CancerType } from '../api/client';

export function useCancerTypes() {
  const [types, setTypes] = useState<CancerType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cancerTypes()
      .then(setTypes)
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  }, []);

  return { types, loading };
}

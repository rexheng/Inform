'use client';
import { useState, useEffect } from 'react';
import { api } from '../api';
import type { ProviderDetail } from '../types';

export function useProvider(odsCode: string | undefined) {
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!odsCode) return;
    setLoading(true);
    api.provider(odsCode)
      .then(setProvider)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load provider'))
      .finally(() => setLoading(false));
  }, [odsCode]);

  return { provider, loading, error };
}

'use client';

import { useEffect, useState } from 'react';

import { LocalAIProvider, LocalModel } from '@/lib/local-ai';

export function useLocalModels(provider: LocalAIProvider | null | undefined) {
  const [models, setModels] = useState<LocalModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchModels() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/models?provider=${provider}`, { cache: 'no-store' });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || 'Failed to fetch models');
        }
        const data = (await response.json()) as { models?: LocalModel[] };
        if (!isCancelled) {
          setModels(data.models || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setModels([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void fetchModels();

    return () => {
      isCancelled = true;
    };
  }, [provider]);

  return { models, loading, error };
}

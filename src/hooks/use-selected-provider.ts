'use client';

import { useCallback, useEffect, useState } from 'react';

import { LocalAIProvider, resolveLocalAIProvider } from '@/lib/local-ai';

export function useSelectedProvider(initialProvider?: LocalAIProvider | null) {
  const [provider, setProvider] = useState<LocalAIProvider | null>(initialProvider ?? null);
  const [loading, setLoading] = useState(!initialProvider);

  useEffect(() => {
    if (initialProvider) {
      setProvider(initialProvider);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadProviderPreference() {
      try {
        const response = await fetch('/api/preferences/provider', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { selectedProvider?: unknown };
        if (!isCancelled) {
          setProvider(resolveLocalAIProvider(data.selectedProvider));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadProviderPreference();

    return () => {
      isCancelled = true;
    };
  }, [initialProvider]);

  const updateProvider = useCallback(async (nextProvider: LocalAIProvider) => {
    setProvider(nextProvider);
    try {
      await fetch('/api/preferences/provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedProvider: nextProvider }),
      });
    } catch {
      // optimistic update; refetch on next load
    }
  }, []);

  return { provider, setProvider: updateProvider, loading };
}

'use client';

import { useEffect, useState } from 'react';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
  capabilities?: string[];
  supportsThinking?: boolean;
  supportsVision?: boolean;
}

export function useOllamaModels() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/ollama/models');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch models');
        }
        const data = await response.json();
        setModels(data.models || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setModels([]);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  return { models, loading, error };
}

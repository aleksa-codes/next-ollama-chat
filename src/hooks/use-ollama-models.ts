'use client';

import { useLocalModels } from '@/hooks/use-local-models';
import { LocalModel } from '@/lib/local-ai';

export type OllamaModel = LocalModel;

export function useOllamaModels() {
  return useLocalModels('ollama');
}

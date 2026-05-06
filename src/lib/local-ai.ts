export const LOCAL_AI_PROVIDERS = ['ollama', 'omlx'] as const;

export type LocalAIProvider = (typeof LOCAL_AI_PROVIDERS)[number];

export const DEFAULT_LOCAL_AI_PROVIDER: LocalAIProvider = 'ollama';

export const LOCAL_AI_PROVIDER_LABELS: Record<LocalAIProvider, string> = {
  ollama: 'Ollama',
  omlx: 'oMLX',
};

export interface LocalModel {
  provider: LocalAIProvider;
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

export function isLocalAIProvider(value: unknown): value is LocalAIProvider {
  return typeof value === 'string' && LOCAL_AI_PROVIDERS.includes(value as LocalAIProvider);
}

export function resolveLocalAIProvider(value: unknown): LocalAIProvider {
  return isLocalAIProvider(value) ? value : DEFAULT_LOCAL_AI_PROVIDER;
}

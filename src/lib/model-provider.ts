import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOllama } from 'ai-sdk-ollama';

import { LocalAIProvider } from '@/lib/local-ai';

const ollama = createOllama();

const omlx = createOpenAICompatible({
  name: 'omlx',
  baseURL: process.env.OMLX_BASE_URL ?? 'http://localhost:8000/v1',
  apiKey: process.env.OMLX_API_KEY,
  includeUsage: true,
});

interface ResolveLanguageModelInput {
  provider: LocalAIProvider;
  model: string;
  supportsThinking?: boolean;
  keepAlive?: string | number;
}

export function resolveLanguageModel({ provider, model, supportsThinking, keepAlive }: ResolveLanguageModelInput) {
  if (provider === 'omlx') {
    return omlx(model);
  }

  return ollama(model, {
    think: supportsThinking,
    keep_alive: keepAlive,
  });
}

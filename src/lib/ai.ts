import type { UIMessage } from 'ai';
import { ollama } from 'ai-sdk-ollama';

export const ollamaProvider = ollama;

export type MessageMetadata = {
  outputTokens?: number;
  duration?: number; // seconds
};

export type ChatUIMessage = UIMessage<MessageMetadata>;

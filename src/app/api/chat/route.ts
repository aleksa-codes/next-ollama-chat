import { streamText as aiStreamText, convertToModelMessages, smoothStream, type UIMessage } from 'ai';
import { streamText as ollamaStreamText } from 'ai-sdk-ollama';
import { NextRequest } from 'next/server';

import { resolveLocalAIProvider } from '@/lib/local-ai';
import { resolveLanguageModel } from '@/lib/model-provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = resolveLocalAIProvider(body.provider);
    const { model, messages, supportsThinking } = body;

    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    let startedAt: number;

    const streamOptions = {
      experimental_transform: smoothStream({ chunking: 'word' }),
      model: resolveLanguageModel({
        provider,
        model,
        supportsThinking,
        keepAlive: provider === 'ollama' ? '5m' : undefined,
      }),
      messages: modelMessages,
    };

    const result = provider === 'ollama' ? await ollamaStreamText(streamOptions) : aiStreamText(streamOptions);

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          startedAt = Date.now();
          return undefined;
        }
        if (part.type === 'finish' && startedAt) {
          const duration = (Date.now() - startedAt) / 1000;
          return {
            outputTokens: part.totalUsage.outputTokens,
            duration,
          };
        }
      },
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(JSON.stringify({ error: 'Could not connect to local model provider' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

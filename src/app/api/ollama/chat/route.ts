import { convertToModelMessages, smoothStream, type UIMessage } from 'ai';
import { createOllama, streamText } from 'ai-sdk-ollama';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ollama = createOllama();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, supportsThinking } = body;

    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    let startedAt: number;

    const result = await streamText({
      experimental_transform: smoothStream({ chunking: 'word' }),
      model: ollama(model, { think: supportsThinking, keep_alive: '5m' }),
      messages: modelMessages,
    });

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
    return new Response(JSON.stringify({ error: 'Could not connect to Ollama' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

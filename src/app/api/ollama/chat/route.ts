import { convertToModelMessages, smoothStream, streamText, type UIMessage } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ollama = createOllama();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, supportsThinking } = body;

    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    const result = streamText({
      experimental_transform: smoothStream({ chunking: 'word' }),
      model: ollama(model, { think: supportsThinking }),
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(JSON.stringify({ error: 'Could not connect to Ollama' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

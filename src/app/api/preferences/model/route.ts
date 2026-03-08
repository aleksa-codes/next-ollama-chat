import { setSelectedModel } from '@/lib/chat-store';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as { selectedModel?: unknown };
  const selectedModel =
    typeof body.selectedModel === 'string'
      ? body.selectedModel
      : body.selectedModel === null || body.selectedModel === undefined
        ? null
        : undefined;

  if (selectedModel === undefined) {
    return Response.json({ error: 'Invalid selected model payload' }, { status: 400 });
  }

  return Response.json({ selectedModel: setSelectedModel(selectedModel) });
}

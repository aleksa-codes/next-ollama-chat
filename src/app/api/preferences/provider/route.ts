import { getSelectedProvider, setSelectedProvider } from '@/lib/chat-store';
import { isLocalAIProvider } from '@/lib/local-ai';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ selectedProvider: getSelectedProvider() });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as { selectedProvider?: unknown };

  if (!isLocalAIProvider(body.selectedProvider)) {
    return Response.json({ error: 'Invalid selected provider payload' }, { status: 400 });
  }

  return Response.json({ selectedProvider: setSelectedProvider(body.selectedProvider) });
}

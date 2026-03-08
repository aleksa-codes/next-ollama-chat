import type { Chat } from '@/lib/chat';
import { removeChat, upsertChat } from '@/lib/chat-store';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ chatId: string }>;
}

function isValidChat(chat: unknown): chat is Chat {
  if (!chat || typeof chat !== 'object') {
    return false;
  }

  const candidate = chat as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.model === 'string' &&
    Array.isArray(candidate.messages) &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.updatedAt === 'number'
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { chatId } = await context.params;
  const body = await request.json();

  if (!isValidChat(body) || body.id !== chatId) {
    return Response.json({ error: 'Invalid chat payload' }, { status: 400 });
  }

  return Response.json(upsertChat(body));
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { chatId } = await context.params;

  removeChat(chatId);

  return new Response(null, { status: 204 });
}

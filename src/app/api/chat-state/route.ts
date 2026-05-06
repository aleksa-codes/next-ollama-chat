import { getSelectedModel, getSelectedProvider, listChats } from '@/lib/chat-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    chats: listChats(),
    selectedModel: getSelectedModel(),
    selectedProvider: getSelectedProvider(),
  });
}

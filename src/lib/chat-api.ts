import type { Chat, ChatState } from '@/lib/chat';

export async function fetchChatState(): Promise<ChatState> {
  const response = await fetch('/api/chat-state', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load chat state');
  }

  return (await response.json()) as ChatState;
}

export async function saveChat(chat: Chat) {
  const response = await fetch(`/api/chats/${chat.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chat),
  });

  if (!response.ok) {
    throw new Error('Failed to save chat');
  }
}

export async function deleteChat(chatId: string) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete chat');
  }
}

export async function saveSelectedModel(selectedModel: string | null) {
  const response = await fetch('/api/preferences/model', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedModel }),
  });

  if (!response.ok) {
    throw new Error('Failed to save selected model');
  }
}

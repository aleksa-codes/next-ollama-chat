import type { ChatUIMessage } from '@/lib/ai';

export interface Chat {
  id: string;
  title: string;
  messages: ChatUIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  chats: Chat[];
  selectedModel: string | null;
}

export function generateTitle(messages: ChatUIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user');

  if (!firstUserMessage) {
    return 'New Chat';
  }

  const text = firstUserMessage.parts
    .filter((part) => part.type === 'text')
    .map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim();

  if (!text) {
    return 'New Chat';
  }

  return text.length > 30 ? `${text.slice(0, 30)}...` : text;
}

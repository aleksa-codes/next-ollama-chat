'use client';

import { ChatInput } from '@/components/chat-input';
import { ChatMessageItem } from '@/components/chat-message';
import { ChatSidebar, type Chat } from '@/components/chat-sidebar';
import { ModelSelector } from '@/components/model-selector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useOllamaModels } from '@/hooks/use-ollama-models';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'ollama-chat-history';
const MODEL_STORAGE_KEY = 'ollama-selected-model';

const SUGGESTED_PROMPTS = [
  { icon: '🚀', text: 'Explain quantum computing in simple terms' },
  { icon: '✍️', text: 'Write a short poem about the ocean' },
  { icon: '🧮', text: 'Help me debug a React component' },
  { icon: '🌍', text: 'What are the best practices for REST APIs?' },
];

function loadChats(): Chat[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Ignore storage errors
  }
}

function loadSelectedModel(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSelectedModel(model: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  } catch {
    // Ignore storage errors
  }
}

function generateTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (firstUserMessage) {
    const text = firstUserMessage.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('');
    if (text.length > 30) {
      return text.substring(0, 30) + '...';
    }
    return text || 'New Chat';
  }
  return 'New Chat';
}

interface ImageFile {
  dataUrl: string;
  name: string;
}

export default function ChatPage() {
  const { models } = useOllamaModels();
  const [selectedModel, setSelectedModel] = useState('');
  const [input, setInput] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ollama/chat' }),
  });

  // Load chats and saved model on mount
  useEffect(() => {
    const loadedChats = loadChats();
    setChats(loadedChats);
    const savedModel = loadSelectedModel();
    if (savedModel) {
      setSelectedModel(savedModel);
    } else if (models.length > 0 && loadedChats.length > 0) {
      setSelectedModel(loadedChats[0].model);
    }
  }, [models]);

  // Save chats when they change
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    saveSelectedModel(model);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const effectiveModel = selectedModel || (models.length > 0 ? models[0].name : '');
  const selectedModelData = models.find((m) => m.name === effectiveModel);
  const supportsThinking = selectedModelData?.supportsThinking ?? false;
  const supportsVision = selectedModelData?.supportsVision ?? false;

  const hasMessages = messages.length > 0;
  const isStreaming = status === 'streaming' || status === 'submitted';
  const isEmptyStart = !hasMessages && !isCreatingChat;

  const handleSend = (content: string, images?: ImageFile[]) => {
    const modelToUse = effectiveModel;
    if (!modelToUse) return;

    // Create chat if it doesn't exist
    /* eslint-disable react-hooks/purity */
    if (!activeChatId) {
      const chatId = crypto.randomUUID();
      const timestamp = Date.now();
      const newChat: Chat = {
        id: chatId,
        title: 'New Chat',
        messages: [],
        model: modelToUse,
        createdAt: timestamp,
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setIsCreatingChat(true);
    }
    /* eslint-enable react-hooks/purity */

    const parts: (
      | { type: 'text'; text: string }
      | { type: 'file'; url: string; mediaType: string; filename?: string }
    )[] = [{ type: 'text', text: content }];

    if (images && images.length > 0) {
      for (const image of images) {
        parts.push({
          type: 'file',
          url: image.dataUrl,
          mediaType: image.dataUrl.split(';')[0].split(':')[1],
          filename: image.name,
        });
      }
    }

    sendMessage(
      { parts },
      { body: { model: modelToUse, supportsThinking, supportsVision: supportsVision && images && images.length > 0 } },
    );
  };

  const handleSuggestedPrompt = (text: string) => {
    const modelToUse = effectiveModel;
    if (!modelToUse) return;
    handleSend(text);
  };

  const handleSubmitWithImages = (images?: ImageFile[]) => {
    if (!input.trim() || !effectiveModel) return;
    handleSend(input.trim(), images);
    setInput('');
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput('');
    setIsCreatingChat(false);
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setActiveChatId(id);
      setMessages(chat.messages);
      setSelectedModel(chat.model);
      setIsCreatingChat(chat.messages.length > 0);
    }
  };

  const handleDeleteChat = (id: string) => {
    const remaining = chats.filter((c) => c.id !== id);
    setChats(remaining);

    if (activeChatId === id) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
        setMessages(remaining[0].messages);
        setSelectedModel(remaining[0].model);
        setIsCreatingChat(remaining[0].messages.length > 0);
      } else {
        setActiveChatId(null);
        setMessages([]);
        setSelectedModel('');
        setIsCreatingChat(false);
      }
    }
  };

  // Update chat with messages when they change
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const title = generateTitle(messages);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId ? { ...chat, title, messages, model: effectiveModel || chat.model } : chat,
        ),
      );
    }
  }, [messages, activeChatId, effectiveModel]);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <Sidebar className='border-sidebar-border border-r'>
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
          />
        </Sidebar>
        <SidebarInset className='flex h-screen flex-col overflow-hidden'>
          {/* Header */}
          <header className='flex h-12 shrink-0 items-center gap-2 px-3'>
            <SidebarTrigger className='h-7 w-7 rounded-lg' />
            <ModelSelector value={selectedModel} onValueChange={handleModelChange} />
          </header>

          {isEmptyStart ? (
            /* Empty State — centered input like ChatGPT */
            <div className='flex flex-1 flex-col items-center justify-center px-4 pb-8'>
              <h1 className='text-foreground mb-8 text-3xl font-medium tracking-tight'>
                {effectiveModel ? `What can I help with?` : "What's on your mind?"}
              </h1>

              <div className='w-full max-w-2xl'>
                <ChatInput
                  input={input}
                  onInputChange={setInput}
                  onSubmit={handleSubmitWithImages}
                  isStreaming={isStreaming}
                  stop={stop}
                  disabled={!effectiveModel}
                  placeholder={effectiveModel ? 'Ask anything...' : 'Select a model first...'}
                  supportsVision={supportsVision}
                />
              </div>

              {effectiveModel && (
                <div className='mt-4 grid w-full max-w-2xl grid-cols-2 gap-3'>
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                      className='group border-border/40 hover:bg-accent bg-muted/30 hover:border-primary/30 flex items-start gap-3 rounded-2xl border px-5 py-4 text-left transition-all hover:shadow-sm'
                    >
                      <span className='text-2xl leading-none'>{prompt.icon}</span>
                      <span className='text-muted-foreground group-hover:text-foreground text-sm transition-colors'>
                        {prompt.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className='text-muted-foreground/60 mt-4 text-xs'>Running locally · Powered by Ollama</p>
            </div>
          ) : (
            /* Chat with messages */
            <>
              <div className='min-h-0 flex-1'>
                <ScrollArea className='h-full'>
                  <div className='mx-auto w-full max-w-3xl py-4'>
                    {messages.map((message, idx) => (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        isStreaming={isStreaming && message.role === 'assistant'}
                        regenerate={
                          message.role === 'assistant' && idx === messages.length - 1
                            ? () =>
                                regenerate({ body: { model: effectiveModel, supportsThinking, supportsVision: false } })
                            : undefined
                        }
                      />
                    ))}
                    {isStreaming && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
                      <div className='flex w-full px-4 py-2'>
                        <span className='flex items-center gap-1 py-1'>
                          <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
                          <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
                          <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full' />
                        </span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className='shrink-0 px-4 pb-4'>
                <div className='mx-auto w-full max-w-3xl'>
                  <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSubmit={handleSubmitWithImages}
                    isStreaming={isStreaming}
                    stop={stop}
                    disabled={!effectiveModel}
                    placeholder={
                      effectiveModel ? `Message ${effectiveModel.split(':')[0]}...` : 'Select a model first...'
                    }
                    supportsVision={supportsVision}
                  />
                </div>
              </div>
            </>
          )}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

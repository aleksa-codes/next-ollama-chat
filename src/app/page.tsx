'use client';

import { ChatInput } from '@/components/chat-input';
import { ChatMessageItem } from '@/components/chat-message';
import { ChatSidebar } from '@/components/chat-sidebar';
import { ModelSelector } from '@/components/model-selector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLocalModels } from '@/hooks/use-local-models';
import type { ChatUIMessage } from '@/lib/ai';
import { generateTitle, type Chat } from '@/lib/chat';
import {
  deleteChat as deletePersistedChat,
  fetchChatState,
  saveSelectedModel as persistSelectedModel,
  saveSelectedProvider as persistSelectedProvider,
  saveChat,
} from '@/lib/chat-api';
import { DEFAULT_LOCAL_AI_PROVIDER, LOCAL_AI_PROVIDER_LABELS, LocalAIProvider } from '@/lib/local-ai';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';

const SUGGESTED_PROMPTS = [
  { icon: '\u{1F680}', text: 'Explain quantum computing in simple terms' },
  { icon: '\u{270D}\u{FE0F}', text: 'Write a short poem about the ocean' },
  { icon: '\u{1F9EE}', text: 'Help me debug a React component' },
  { icon: '\u{1F30D}', text: 'What are the best practices for REST APIs?' },
];

interface ImageFile {
  dataUrl: string;
  name: string;
}

export default function ChatPage() {
  const [provider, setProvider] = useState<LocalAIProvider | null>(null);
  const { models } = useLocalModels(provider);
  const [selectedModel, setSelectedModel] = useState('');
  const [input, setInput] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedStateRef = useRef(false);
  const skipNextMessageSyncRef = useRef(false);

  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadState() {
      try {
        const state = await fetchChatState();

        if (isCancelled) {
          return;
        }

        setChats(state.chats);
        setProvider(state.selectedProvider ?? DEFAULT_LOCAL_AI_PROVIDER);
        if (state.selectedModel) {
          setSelectedModel(state.selectedModel);
        }
      } catch (error) {
        console.error('[Chat] Failed to load persisted state:', error);
      } finally {
        if (!isCancelled) {
          hasLoadedStateRef.current = true;
          setIsLoadingState(false);
        }
      }
    }

    void loadState();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStateRef.current) {
      return;
    }

    if (models.length === 0) {
      if (selectedModel) {
        setSelectedModel('');
      }
      return;
    }

    if (selectedModel && models.some((model) => model.name === selectedModel)) {
      return;
    }

    const currentChatModel = chats[0]?.model;
    const nextModel =
      currentChatModel && models.some((model) => model.name === currentChatModel) ? currentChatModel : models[0].name;
    setSelectedModel(nextModel);
  }, [chats, models, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const effectiveModel = selectedModel || (models.length > 0 ? models[0].name : '');
  const selectedModelData = models.find((model) => model.name === effectiveModel);
  const supportsThinking = selectedModelData?.supportsThinking ?? false;
  const supportsVision = selectedModelData?.supportsVision ?? false;

  const hasMessages = messages.length > 0;
  const isStreaming = status === 'streaming' || status === 'submitted';
  const isEmptyStart = !isLoadingState && !hasMessages && !isCreatingChat;

  const updateSelectedModel = async (model: string) => {
    setSelectedModel(model);

    if (activeChatId) {
      const updatedAt = Date.now();

      setChats((prev) => prev.map((chat) => (chat.id === activeChatId ? { ...chat, model, updatedAt } : chat)));
    }

    try {
      await persistSelectedModel(model);
    } catch (error) {
      console.error('[Chat] Failed to persist selected model:', error);
    }
  };

  const updateProvider = async (nextProvider: LocalAIProvider) => {
    setProvider(nextProvider);
    try {
      await persistSelectedProvider(nextProvider);
    } catch (error) {
      console.error('[Chat] Failed to persist selected provider:', error);
    }
  };

  const handleSend = (content: string, images?: ImageFile[]) => {
    const modelToUse = effectiveModel;
    if (!modelToUse) {
      return;
    }

    if (!activeChatId) {
      const chatId = crypto.randomUUID();
      const timestamp = Date.now();
      const newChat: Chat = {
        id: chatId,
        title: 'New Chat',
        messages: [],
        model: modelToUse,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
      setIsCreatingChat(true);
    }

    const parts: (
      | { type: 'text'; text: string }
      | { type: 'file'; url: string; mediaType: string; filename?: string }
    )[] = [{ type: 'text', text: content }];

    if (images?.length) {
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
      {
        body: {
          provider,
          model: modelToUse,
          supportsThinking,
          supportsVision: supportsVision && Boolean(images?.length),
        },
      },
    );
  };

  const handleSubmitWithImages = (images?: ImageFile[]) => {
    if (!input.trim() || !effectiveModel) {
      return;
    }

    handleSend(input.trim(), images);
    setInput('');
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    skipNextMessageSyncRef.current = true;
    setMessages([]);
    setInput('');
    setIsCreatingChat(false);
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find((candidate) => candidate.id === id);
    if (!chat) {
      return;
    }

    setActiveChatId(chat.id);
    skipNextMessageSyncRef.current = true;
    setMessages(chat.messages);
    setSelectedModel(chat.model);
    setIsCreatingChat(chat.messages.length > 0);

    void persistSelectedModel(chat.model).catch((error) => {
      console.error('[Chat] Failed to persist selected model:', error);
    });
  };

  const handleDeleteChat = (id: string) => {
    const remaining = chats.filter((chat) => chat.id !== id);

    setChats(remaining);
    void deletePersistedChat(id).catch((error) => {
      console.error('[Chat] Failed to delete chat:', error);
    });

    if (activeChatId !== id) {
      return;
    }

    stop();

    if (remaining.length > 0) {
      const nextChat = remaining[0];

      setActiveChatId(nextChat.id);
      skipNextMessageSyncRef.current = true;
      setMessages(nextChat.messages);
      setSelectedModel(nextChat.model);
      setIsCreatingChat(nextChat.messages.length > 0);
      void persistSelectedModel(nextChat.model).catch((error) => {
        console.error('[Chat] Failed to persist selected model:', error);
      });
      return;
    }

    setActiveChatId(null);
    skipNextMessageSyncRef.current = true;
    setMessages([]);
    setIsCreatingChat(false);
  };

  useEffect(() => {
    if (skipNextMessageSyncRef.current) {
      skipNextMessageSyncRef.current = false;
      return;
    }

    if (!activeChatId || messages.length === 0) {
      return;
    }

    const title = generateTitle(messages);
    const updatedAt = Date.now();

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title,
              messages,
              model: effectiveModel || chat.model,
              updatedAt,
            }
          : chat,
      ),
    );
    setIsCreatingChat(true);
  }, [messages, activeChatId, effectiveModel]);

  useEffect(() => {
    if (!hasLoadedStateRef.current || !activeChatId) {
      return;
    }

    const activeChat = chats.find((chat) => chat.id === activeChatId);
    if (!activeChat || activeChat.messages.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveChat(activeChat).catch((error) => {
        console.error('[Chat] Failed to persist chat:', error);
      });
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeChatId, chats]);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <Sidebar className='border-sidebar-border border-r'>
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            provider={provider}
            onProviderChange={updateProvider}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
          />
        </Sidebar>
        <SidebarInset className='flex h-screen flex-col overflow-hidden'>
          <header className='flex h-12 shrink-0 items-center gap-2 px-3'>
            <SidebarTrigger className='h-7 w-7 rounded-lg' />
            <ModelSelector provider={provider} value={selectedModel} onValueChange={updateSelectedModel} />
          </header>

          {isEmptyStart ? (
            <div className='flex flex-1 flex-col items-center justify-center px-4 pb-8'>
              <h1 className='text-foreground mb-8 text-3xl font-medium tracking-tight'>
                {effectiveModel ? 'What can I help with?' : "What's on your mind?"}
              </h1>

              <div className='w-full max-w-2xl'>
                <ChatInput
                  input={input}
                  onInputChange={setInput}
                  onSubmit={handleSubmitWithImages}
                  isStreaming={isStreaming}
                  stop={stop}
                  disabled={!effectiveModel || isLoadingState}
                  placeholder={effectiveModel ? 'Ask anything...' : 'Select a model first...'}
                  supportsVision={supportsVision}
                />
              </div>

              {effectiveModel && (
                <div className='mt-4 grid w-full max-w-2xl grid-cols-2 gap-3'>
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.text}
                      onClick={() => handleSend(prompt.text)}
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

              <p className='text-muted-foreground/60 mt-4 text-xs'>
                Running locally · Powered by {provider ? LOCAL_AI_PROVIDER_LABELS[provider] : '...'}
              </p>
            </div>
          ) : (
            <>
              <div className='min-h-0 flex-1'>
                <ScrollArea className='h-full'>
                  <div className='mx-auto w-full max-w-3xl py-4'>
                    {messages.map((message, index) => (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        isStreaming={isStreaming && message.role === 'assistant'}
                        regenerate={
                          message.role === 'assistant' && index === messages.length - 1
                            ? () =>
                                regenerate({
                                  body: { provider, model: effectiveModel, supportsThinking, supportsVision: false },
                                })
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
                    disabled={!effectiveModel || isLoadingState}
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

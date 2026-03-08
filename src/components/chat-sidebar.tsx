'use client';

import { ModeToggle } from '@/components/mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/chat';
import { cn } from '@/lib/utils';
import { MessageSquare, MoreHorizontal, PenSquare, Phone, Swords, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatSidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }: ChatSidebarProps) {
  return (
    <Sidebar className='border-sidebar-border border-r'>
      <SidebarHeader className='px-3 py-3'>
        <div className='flex items-center justify-between'>
          <span className='px-1 text-sm font-semibold tracking-tight'>Ollama Chat</span>
          <button
            className='text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors'
            onClick={onNewChat}
            title='New chat'
          >
            <PenSquare className='h-4 w-4' />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className='px-2'>
        <div className='mb-2 flex flex-col gap-1.5 px-2 py-2'>
          <Link
            href='/arena'
            className='flex items-center gap-2 rounded-lg bg-linear-to-r from-orange-500/10 to-rose-500/10 px-3 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/20'
          >
            <Swords className='h-4 w-4' />
            Enter Arena
          </Link>
          <Link
            href='/voice'
            className='flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/20'
          >
            <Phone className='h-4 w-4' />
            Voice Chat
          </Link>
        </div>

        {chats.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 px-4 py-16 text-center'>
            <MessageSquare className='text-muted-foreground/30 h-6 w-6' />
            <p className='text-muted-foreground text-xs'>No conversations yet</p>
          </div>
        ) : (
          <SidebarGroup className='p-0'>
            <SidebarGroupLabel className='text-muted-foreground px-2 text-xs font-medium'>Your chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.id} className='group/chat'>
                    <SidebarMenuButton
                      isActive={chat.id === activeChatId}
                      onClick={() => onSelectChat(chat.id)}
                      className={cn(
                        'rounded-lg px-3 py-2',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        chat.id === activeChatId && 'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                    >
                      <span className='truncate text-sm'>{chat.title}</span>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          className={cn(
                            'opacity-0 transition-opacity group-hover/chat:opacity-100 data-[state=open]:opacity-100',
                            chat.id === activeChatId && 'opacity-100',
                          )}
                        >
                          <MoreHorizontal className='h-3.5 w-3.5' />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' side='right' className='w-36'>
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          onClick={() => onDeleteChat(chat.id)}
                        >
                          <Trash2 className='mr-2 h-3.5 w-3.5' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className='px-3 py-3'>
        <div className='flex items-center justify-between px-1'>
          <span className='text-muted-foreground text-xs'>Theme</span>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

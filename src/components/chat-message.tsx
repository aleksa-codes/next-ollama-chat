'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ChatUIMessage } from '@/lib/ai';
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Hash,
  RefreshCw,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';
import { codeToHtml } from 'shiki';

import { useSpeech } from '@/hooks/use-speech';

interface ChatMessageItemProps {
  message: ChatUIMessage;
  isStreaming?: boolean;
  regenerate?: () => void;
}

function getMessageText(message: ChatUIMessage): string {
  const textParts = message.parts.filter((part) => part.type === 'text');
  return textParts.map((part) => (part as { type: 'text'; text: string }).text).join('');
}

async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code.trim(), {
      lang: lang || 'text',
      theme: 'github-dark',
    });
  } catch {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
  };
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  const promises: Promise<void>[] = [];
  const replacements: { from: string; to: string }[] = [];

  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const lang = match[1];
    const code = decodeHtmlEntities(match[2]);

    const promise = highlightCode(code, lang).then((highlighted) => {
      const copyIcon =
        '<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

      const wrapped =
        '<div class="code-block-wrapper rounded-lg border bg-muted/50 overflow-hidden">' +
        '<div class="flex items-center justify-between border-b bg-muted px-3 py-1.5">' +
        '<span class="text-muted-foreground text-xs font-medium uppercase">' +
        lang +
        '</span>' +
        '<button class="copy-code-btn text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors" data-copy>' +
        copyIcon +
        '<span>Copy</span>' +
        '</button></div>' +
        highlighted.replace('<pre>', '<pre class="p-3 text-sm overflow-x-auto rounded-b-lg rounded-t-none">') +
        '</div>';

      replacements.push({ from: fullMatch, to: wrapped });
    });

    promises.push(promise);
  }

  await Promise.all(promises);

  let result = html;
  for (const { from, to } of replacements) {
    result = result.replace(from, to);
  }

  return result;
}

async function renderMarkdown(text: string): Promise<string> {
  const html = (await marked.parse(text)) as string;
  return highlightCodeBlocks(html);
}

function getReasoningText(message: ChatUIMessage): string | undefined {
  const reasoningParts = message.parts.filter((part) => part.type === 'reasoning');
  if (reasoningParts.length === 0) return undefined;
  return reasoningParts.map((part) => (part as { type: 'reasoning'; text: string }).text).join('');
}

function getMessageImages(message: ChatUIMessage): { url: string; filename?: string }[] {
  const fileParts = message.parts.filter((part) => part.type === 'file');
  return fileParts
    .map((part) => {
      const filePart = part as { type: 'file'; url?: string; filename?: string };
      return {
        url: filePart.url || '',
        filename: filePart.filename,
      };
    })
    .filter((img) => img.url);
}

export function ChatMessageItem({ message, isStreaming, regenerate }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const isUser = message.role === 'user';
  const { toggle: toggleSpeech, isSpeaking } = useSpeech();

  const text = getMessageText(message);
  const reasoning = getReasoningText(message);
  const images = getMessageImages(message);
  const html = useMemo(() => (text ? renderMarkdown(text) : Promise.resolve('')), [text]);

  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest('.copy-code-btn');
      if (btn) {
        const wrapper = (btn as Element).closest('.code-block-wrapper');
        if (wrapper) {
          const code = wrapper.querySelector('code')?.textContent;
          if (code) {
            navigator.clipboard.writeText(code);
            btn.innerHTML =
              '<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
            setTimeout(() => {
              btn.innerHTML =
                '<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
            }, 2000);
          }
        }
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className='flex w-full flex-col items-end gap-0.5 p-2'>
        {images.length > 0 && (
          <div className='flex max-w-[75%] flex-wrap justify-end gap-1.5'>
            {images.map((img, idx) => (
              <div key={idx} className='relative shrink-0'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.filename || 'Uploaded image'}
                  className='border-border/20 h-36 w-36 rounded-xl border object-cover'
                />
              </div>
            ))}
          </div>
        )}
        <div className='bg-secondary text-secondary-foreground max-w-[70%] min-w-[50px] rounded-[18px] px-3 py-2 text-center text-base'>
          <div className='whitespace-pre-wrap'>{text}</div>
        </div>
      </div>
    );
  }

  const isStreamingReasoning = isStreaming && !text;

  return (
    <div className='group flex w-full flex-col gap-1 p-2'>
      {reasoning && (
        <div className='border-muted bg-muted mb-2 rounded-lg border'>
          <button
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
            className='text-foreground hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors'
          >
            {isReasoningExpanded ? (
              <ChevronDown className='h-4 w-4 shrink-0' />
            ) : (
              <ChevronRight className='h-4 w-4 shrink-0' />
            )}
            <span className='flex items-center gap-1.5'>
              <Brain className='h-4 w-4 shrink-0 text-purple-500' />
              Thinking
            </span>
            {!isReasoningExpanded && (
              <span className='text-muted-foreground max-w-[200px] truncate'>{reasoning.substring(0, 50)}...</span>
            )}
          </button>
          {isReasoningExpanded && (
            <div className='border-muted text-muted-foreground border-t px-3 py-2 text-sm'>
              <div className='leading-relaxed whitespace-pre-wrap'>{reasoning}</div>
            </div>
          )}
        </div>
      )}
      <div className='max-w-[85%] text-base leading-relaxed'>
        {text === '' && isStreamingReasoning ? (
          <span className='flex items-center gap-1 py-1'>
            <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
            <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
            <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full' />
          </span>
        ) : (
          <div className='prose text-foreground dark:prose-invert prose-pre:m-0 prose-pre:my-0 prose-pre:rounded-t-none prose-code:m-0 prose-code:p-0 max-w-none break-words'>
            <AsyncHtml html={html} isStreaming={isStreaming} />
          </div>
        )}
      </div>

      {text && (
        <div className='flex flex-wrap items-center gap-1'>
          <GenerationStats metadata={message.metadata} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleCopy}>
                {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='text-sm'>
              {copied ? 'Copied!' : 'Copy'}
            </TooltipContent>
          </Tooltip>
          {regenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8' onClick={regenerate}>
                  <RefreshCw className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-sm'>
                Regenerate
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => toggleSpeech(text)}>
                {isSpeaking ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='text-sm'>
              {isSpeaking ? 'Stop' : 'Read aloud'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

function GenerationStats({ metadata }: { metadata?: { outputTokens?: number; duration?: number } }) {
  if (!metadata?.outputTokens || !metadata?.duration) return null;

  const { outputTokens, duration } = metadata;
  const tokPerSec = duration > 0 ? outputTokens / duration : 0;

  return (
    <>
      <div className='text-muted-foreground flex items-center gap-2.5 rounded-md px-1.5 py-1 text-xs'>
        <span className='flex items-center gap-1'>
          <Zap className='h-3 w-3 text-yellow-500' />
          <span className='font-medium'>{tokPerSec.toFixed(1)}</span>
          <span className='text-muted-foreground/70'>tok/s</span>
        </span>
        <span className='text-muted-foreground/30'>|</span>
        <span className='flex items-center gap-1'>
          <Hash className='text-muted-foreground/60 h-3 w-3' />
          <span className='font-medium'>{outputTokens.toLocaleString()}</span>
          <span className='text-muted-foreground/70'>tokens</span>
        </span>
        <span className='text-muted-foreground/30'>|</span>
        <span className='flex items-center gap-1'>
          <Clock className='text-muted-foreground/60 h-3 w-3' />
          <span className='font-medium'>
            {duration < 1 ? `${(duration * 1000).toFixed(0)}ms` : `${duration.toFixed(2)}s`}
          </span>
        </span>
      </div>
      <div className='bg-border mx-0.5 h-4 w-px' />
    </>
  );
}

function AsyncHtml({ html, isStreaming }: { html: Promise<string>; isStreaming?: boolean }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    html.then((resolved) => setContent(resolved));
  }, [html]);

  if (isStreaming && !content) {
    return (
      <span className='flex items-center gap-1 py-1'>
        <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
        <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
        <span className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full' />
      </span>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

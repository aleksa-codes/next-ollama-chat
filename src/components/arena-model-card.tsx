'use client';

import { ArenaPreview } from '@/components/arena-preview';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OllamaModel } from '@/hooks/use-ollama-models';
import { ArenaCompetitor, extractCode, formatDuration } from '@/lib/arena';
import { Brain, ChevronDown, ChevronRight, Code2, Download, Eye, FileText, Loader2, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { codeToHtml } from 'shiki';

const MODE_LANG: Record<string, string> = {
  p5: 'javascript',
  svg: 'xml',
  html: 'html',
  three: 'javascript',
  website: 'html',
  games: 'html',
};

async function highlight(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang, theme: 'github-dark' });
  } catch {
    return `<pre class="p-4 text-xs font-mono">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
  }
}

interface ArenaModelCardProps {
  competitor: ArenaCompetitor;
  mode: string;
  model?: OllamaModel;
  onSkip?: () => void;
}

const MODE_EXTENSIONS: Record<string, string> = {
  p5: 'html',
  svg: 'svg',
  html: 'html',
  three: 'html',
  website: 'html',
  games: 'html',
};

export function ArenaModelCard({ competitor, mode, model, onSkip }: ArenaModelCardProps) {
  const [view, setView] = useState<'preview' | 'code' | 'raw'>('preview');
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const reasoningRef = useRef<HTMLDivElement>(null);

  // Highlight code when view switches to code or code updates
  useEffect(() => {
    let cancelled = false;
    const lang = MODE_LANG[mode] || 'html';
    const work =
      view !== 'code' || !competitor.code ? Promise.resolve('') : highlight(extractCode(competitor.code), lang);
    work.then((html) => {
      if (!cancelled) setHighlightedCode(html);
    });
    return () => {
      cancelled = true;
    };
  }, [view, competitor.code, mode]);

  useEffect(() => {
    if (isReasoningExpanded && reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [competitor.reasoning, isReasoningExpanded]);

  // Live timer while running
  useEffect(() => {
    if (competitor.status !== 'running' || !competitor.startTime) {
      const t = setTimeout(() => setElapsedMs(0));
      return () => clearTimeout(t);
    }
    const start = competitor.startTime;
    const id = setInterval(() => setElapsedMs(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [competitor.status, competitor.startTime]);

  const handleDownload = () => {
    if (!competitor.code) return;
    const extractedCode = extractCode(competitor.code);
    const extension = MODE_EXTENSIONS[mode] || 'txt';
    const mimeType = extension === 'html' || extension === 'svg' ? 'text/html' : 'text/plain';
    const blob = new Blob([extractedCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${competitor.id.split(':')[0]}-${mode}-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className='bg-card flex h-full flex-col overflow-hidden rounded-t-xl border shadow-sm'>
      {/* Header */}
      <div className='bg-muted/20 flex items-center justify-between border-b px-4 py-2'>
        <div className='flex items-center gap-2'>
          <h3 className='font-medium'>{competitor.id.split(':')[0]}</h3>
          {model?.supportsThinking && <Brain className='h-3.5 w-3.5 shrink-0 text-purple-500' />}
          {model?.details?.parameter_size && (
            <span className='text-muted-foreground text-xs'>{model.details.parameter_size}</span>
          )}
          {competitor.status === 'running' && <Loader2 className='text-muted-foreground h-3.5 w-3.5 animate-spin' />}
          {competitor.status === 'done' && <span className='h-2 w-2 rounded-full bg-green-500' />}
          {competitor.status === 'error' && <span className='bg-destructive h-2 w-2 rounded-full' />}
          {competitor.status === 'skipped' && <span className='h-2 w-2 rounded-full bg-amber-500' />}
          {competitor.status === 'running' && (
            <span className='text-muted-foreground font-mono text-xs tabular-nums'>{formatDuration(elapsedMs)}</span>
          )}
          {competitor.status === 'running' && onSkip && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 gap-1 px-2 text-xs text-amber-500 hover:text-amber-600'
              onClick={onSkip}
            >
              <SkipForward className='h-3.5 w-3.5' />
              Skip
            </Button>
          )}
          {competitor.status === 'done' && competitor.duration !== undefined && (
            <span className='text-muted-foreground font-mono text-xs tabular-nums'>
              {formatDuration(competitor.duration)}
            </span>
          )}
          {competitor.status === 'skipped' && competitor.duration !== undefined && (
            <span className='text-muted-foreground font-mono text-xs tabular-nums'>
              {formatDuration(competitor.duration)}
            </span>
          )}
        </div>

        <div className='flex items-center gap-1.5'>
          <div className='bg-background flex items-center rounded-lg border p-0.5'>
            <Button
              variant='ghost'
              size='sm'
              className={`h-7 rounded-md px-2.5 text-xs ${view === 'preview' ? 'bg-muted shadow-sm' : ''}`}
              onClick={() => setView('preview')}
            >
              <Eye className='mr-1.5 h-3.5 w-3.5' />
              Preview
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className={`h-7 rounded-md px-2.5 text-xs ${view === 'code' ? 'bg-muted shadow-sm' : ''}`}
              onClick={() => setView('code')}
            >
              <Code2 className='mr-1.5 h-3.5 w-3.5' />
              Code
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className={`h-7 rounded-md px-2.5 text-xs ${view === 'raw' ? 'bg-muted shadow-sm' : ''}`}
              onClick={() => setView('raw')}
            >
              <FileText className='mr-1.5 h-3.5 w-3.5' />
              Raw
            </Button>
          </div>
          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleDownload} disabled={!competitor.code}>
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='bg-background relative flex min-h-0 flex-1 flex-col overflow-hidden'>
        {/* Reasoning Section */}
        {competitor.reasoning && (
          <div className='border-muted bg-muted m-2 rounded-lg border'>
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
              {!isReasoningExpanded && competitor.status === 'running' && !competitor.code && (
                <span className='text-muted-foreground ml-auto flex items-center gap-1'>
                  <span className='bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]' />
                  <span className='bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]' />
                  <span className='bg-muted-foreground h-1.5 w-1.5 animate-bounce rounded-full' />
                </span>
              )}
            </button>
            {isReasoningExpanded && (
              <div
                ref={reasoningRef}
                className='border-muted text-muted-foreground max-h-32 overflow-y-auto border-t px-3 py-2 text-sm'
              >
                <div className='leading-relaxed whitespace-pre-wrap'>{competitor.reasoning}</div>
              </div>
            )}
          </div>
        )}

        {view === 'preview' ? (
          competitor.status === 'done' ? (
            <div className='flex flex-1 overflow-hidden'>
              <ArenaPreview code={competitor.code} mode={mode} />
            </div>
          ) : (
            <div className='text-muted-foreground flex w-full flex-1 items-center justify-center gap-4 p-6 text-center'>
              {competitor.status === 'running' ? (
                <>
                  <Loader2 className='h-8 w-8 animate-spin opacity-50' />
                  <p className='text-sm'>Generating code... preview will appear when finished.</p>
                </>
              ) : competitor.status === 'idle' ? (
                <>
                  <Code2 className='h-8 w-8 opacity-20' />
                  <p className='text-sm'>Waiting for turn...</p>
                </>
              ) : competitor.status === 'skipped' ? (
                <>
                  <SkipForward className='h-8 w-8 opacity-50' />
                  <p className='text-sm'>Skipped by user.</p>
                </>
              ) : (
                <>
                  <span className='text-destructive'>Error generating code.</span>
                </>
              )}
            </div>
          )
        ) : view === 'code' ? (
          <div className='min-h-0 flex-1 overflow-hidden'>
            <ScrollArea className='h-full w-full'>
              {highlightedCode ? (
                <div
                  className='[&_pre]:m-0! [&_pre]:min-h-full [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:p-4 [&_pre]:text-xs [&_pre]:leading-relaxed'
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              ) : (
                <pre className='text-muted-foreground p-4 font-mono text-xs leading-relaxed'>
                  {competitor.code ? 'Highlighting...' : 'Waiting to generate code...'}
                </pre>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className='min-h-0 flex-1 overflow-hidden'>
            <ScrollArea className='h-full w-full'>
              <pre className='text-muted-foreground w-full min-w-0 p-4 font-mono text-xs leading-relaxed break-all'>
                {competitor.code || 'Waiting to generate...'}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

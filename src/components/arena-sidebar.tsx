'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ArenaMode } from '@/lib/arena';
import { LocalModel } from '@/lib/local-ai';
import { cn } from '@/lib/utils';
import { Brain, Info, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function parseParamSize(size: string): number {
  const match = size?.match(/^([\d.]+)\s*([KMBT]?)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  return val * (multipliers[unit] ?? 1);
}

interface ArenaSidebarProps {
  models: LocalModel[];
  modes: ArenaMode[];
  selectedModeId: string;
  onModeSelect: (id: string) => void;
  selectedModels: string[];
  onModelToggle: (model: string) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ArenaSidebar({
  models,
  modes,
  selectedModeId,
  onModeSelect,
  selectedModels,
  onModelToggle,
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
}: ArenaSidebarProps) {
  const selectedMode = modes.find((m) => m.id === selectedModeId);
  const [presetsOpen, setPresetsOpen] = useState(false);

  return (
    <div className='bg-sidebar/50 flex h-full w-72 flex-col border-r backdrop-blur-xl xl:w-80'>
      <div className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
        <h2 className='text-sm font-semibold tracking-tight'>Compare AI Models</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon' className='text-muted-foreground hover:text-foreground h-8 w-8'>
              <Info className='h-4 w-4' />
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>How the Arena Works</DialogTitle>
              <DialogDescription>
                The Arena allows you to pit multiple local AI models against each other to see which generates the best
                code.
              </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col gap-4 py-4 text-sm'>
              <div className='grid gap-1'>
                <h4 className='font-medium'>Sequential Execution</h4>
                <p className='text-muted-foreground'>
                  To avoid overloading your machine or crashing the local GPU, models execute your prompt{' '}
                  <strong>one by one</strong> rather than simultaneously.
                </p>
              </div>
              <div className='grid gap-1'>
                <h4 className='font-medium'>Sandboxing</h4>
                <p className='text-muted-foreground'>
                  The generated code (P5.js, SVG, Three.js, etc.) is rendered securely in a sandboxed iframe. If a model
                  tries to fetch external assets that aren&apos;t available, the output might look incorrect.
                </p>
              </div>
              <div className='grid gap-1'>
                <h4 className='font-medium'>Model Picking</h4>
                <p className='text-muted-foreground'>
                  You can select 2 or more local models. Note that distillation/reasoning models might take a bit longer
                  but will typically generate higher quality complex outputs!
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className='flex min-h-0 flex-1 flex-col gap-4 p-4'>
        <section className='flex min-h-0 flex-1 flex-col'>
          <h3 className='text-muted-foreground mb-3 flex shrink-0 items-center justify-between text-xs font-medium tracking-wider uppercase'>
            <span>1. Competitors (2+)</span>
            <span className='text-[10px] lowercase opacity-70'>{selectedModels.length} selected</span>
          </h3>
          <ScrollArea className='-mr-3 min-h-0 flex-1 pr-3'>
            <div className='flex flex-col gap-2 pb-2'>
              {models.length === 0 ? (
                <div className='text-muted-foreground rounded-lg border border-dashed p-3 text-xs'>
                  No models found for the selected backend.
                </div>
              ) : (
                [...models]
                  .sort((a, b) => {
                    const paramDiff =
                      parseParamSize(a.details.parameter_size) - parseParamSize(b.details.parameter_size);
                    if (paramDiff !== 0) return paramDiff;
                    return a.name.localeCompare(b.name);
                  })
                  .map((model) => {
                    const isSelected = selectedModels.includes(model.name);
                    return (
                      <label
                        key={model.name}
                        className={cn(
                          'hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-all',
                          isSelected && 'border-primary/30 bg-primary/5',
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onModelToggle(model.name)}
                          className={cn(isSelected && 'border-primary bg-primary text-primary-foreground')}
                        />
                        <div className='flex min-w-0 flex-1 flex-col wrap-break-word'>
                          <span className='flex items-center gap-1.5 text-sm leading-tight font-medium break-all'>
                            {model.name.split(':')[0]}
                            {model.supportsThinking && <Brain className='h-3.5 w-3.5 shrink-0 text-purple-500' />}
                          </span>
                          <div className='text-muted-foreground mt-1 flex w-full flex-wrap items-center gap-1.5 text-xs opacity-80'>
                            <span>{model.details.parameter_size}</span>
                            <span>·</span>
                            <span className='truncate'>{model.details.family}</span>
                            <span>·</span>
                            <span className='shrink-0'>{formatBytes(model.size)}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })
              )}
            </div>
          </ScrollArea>
        </section>

        <section className='shrink-0'>
          <h3 className='text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase'>2. Mode</h3>
          <div className='grid grid-cols-3 gap-1.5'>
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedModeId === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => onModeSelect(mode.id)}
                  className={cn(
                    'bg-muted/50 hover:bg-muted flex items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-xs transition-all',
                    isSelected && 'border-primary/50 bg-primary/10 text-primary shadow-sm',
                  )}
                >
                  <Icon className='h-3.5 w-3.5' />
                  <span>{mode.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className='shrink-0'>
          <h3 className='text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase'>3. Your Prompt</h3>
          {selectedMode && (
            <Dialog open={presetsOpen} onOpenChange={setPresetsOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm' className='mb-2 h-8 w-full justify-start gap-2 text-xs'>
                  <Sparkles className='h-3.5 w-3.5' />
                  Browse presets…
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <selectedMode.icon className='h-4 w-4' />
                    {selectedMode.name} Presets
                  </DialogTitle>
                  <DialogDescription>Pick a preset to use as your prompt.</DialogDescription>
                </DialogHeader>
                <ScrollArea className='max-h-[60vh]'>
                  <div className='grid grid-cols-3 gap-2 pr-3'>
                    {selectedMode.presets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onPromptChange(preset.prompt);
                          setPresetsOpen(false);
                        }}
                        className='bg-muted/40 hover:bg-muted hover:border-primary/40 rounded-lg border p-3 text-left text-sm transition-all'
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder='Describe what to build...'
            className='bg-background/50 min-h-22 resize-none text-sm'
          />
        </section>
      </div>

      <div className='flex shrink-0 items-center gap-2 border-t p-4'>
        <Button
          variant='secondary'
          size='icon'
          className='shrink-0'
          onClick={() => onPromptChange('')}
          disabled={isGenerating || !prompt}
          title='Clear prompt'
        >
          <RotateCcw className='h-4 w-4' />
        </Button>
        <Button
          className='flex-1 gap-2 bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-md hover:from-orange-600 hover:to-rose-600'
          onClick={onGenerate}
          disabled={isGenerating || selectedModels.length < 2 || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Generating...
            </>
          ) : (
            <>
              <Play className='h-4 w-4 fill-white' />
              Generate Arena
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

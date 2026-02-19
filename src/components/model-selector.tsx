'use client';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOllamaModels } from '@/hooks/use-ollama-models';
import { Brain, Check, ChevronDown, Image, Loader2, Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getModelDisplayName(name: string): string {
  if (name.includes('hf.co/')) {
    const parts = name.split('/');
    return parts[parts.length - 1].split(':')[0];
  }
  return name.split(':')[0];
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  const { models, loading, error } = useOllamaModels();

  if (loading) {
    return (
      <div className='text-muted-foreground flex items-center gap-2 px-3 py-2 text-base'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span>Loading models...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-destructive flex items-center gap-2 px-3 py-2 text-base'>
        <span>Ollama not connected</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className='text-muted-foreground flex items-center gap-2 px-3 py-2 text-base'>
        <span>No models found</span>
      </div>
    );
  }

  const selectedModel = models.find((m) => m.name === value);

  return (
    <DropdownMenu>
      {/* Updated Trigger to look like a clean, borderless header matching the screenshot */}
      <DropdownMenuTrigger className='hover:bg-accent focus-visible:ring-ring flex items-center gap-2 rounded-xl px-3 py-2 text-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2'>
        <span className='truncate'>{selectedModel ? getModelDisplayName(selectedModel.name) : 'Select model'}</span>
        <ChevronDown className='text-muted-foreground h-5 w-5 shrink-0' />
      </DropdownMenuTrigger>

      {/* Increased width and added padding to match the roomy feel of the image */}
      <DropdownMenuContent align='start' className='w-[360px] rounded-2xl p-2'>
        <div className='flex flex-col gap-1'>
          {models.map((model) => {
            const isSelected = model.name === value;

            // Determine an icon to show on the left based on capabilities
            const ModelIcon = model.supportsThinking ? Brain : model.supportsVision ? Image : Sparkles;

            return (
              <DropdownMenuItem
                key={model.name}
                onClick={() => onValueChange(model.name)}
                // Changed to a custom grid/flex layout matching the row in the screenshot
                className='focus:bg-accent flex cursor-pointer items-center gap-3 rounded-xl p-3'
              >
                {/* Left Icon */}
                <div className='text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center'>
                  <ModelIcon className='h-6 w-6' strokeWidth={1.5} />
                </div>

                {/* Middle Content (Title + Subtitle) */}
                <div className='flex flex-1 flex-col gap-1 overflow-hidden'>
                  <div className='flex items-center gap-2'>
                    <span className='truncate text-base leading-none font-medium'>
                      {getModelDisplayName(model.name)}
                    </span>
                    {/* Kept your original badges, scaled slightly to fit the new layout */}
                    <div className='flex shrink-0 items-center gap-1'>
                      {model.supportsThinking && (
                        <Badge
                          variant='outline'
                          className='border-purple-500/50 bg-purple-500/10 px-1.5 py-0 text-[10px] text-purple-500'
                        >
                          Think
                        </Badge>
                      )}
                      {model.supportsVision && (
                        <Badge
                          variant='outline'
                          className='border-green-500/50 bg-green-500/10 px-1.5 py-0 text-[10px] text-green-500'
                        >
                          Vision
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Kept your original model details info but styled as the subtitle */}
                  <div className='text-muted-foreground flex w-full items-center gap-1.5 text-sm'>
                    <span>{model.details.parameter_size}</span>
                    <span>·</span>
                    <span className='truncate'>{model.details.family}</span>
                    <span>·</span>
                    <span className='shrink-0'>{formatBytes(model.size)}</span>
                  </div>
                </div>

                {/* Right Side Checkmark */}
                <div className='flex w-6 shrink-0 items-center justify-end'>
                  {isSelected && <Check className='text-foreground h-5 w-5' />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

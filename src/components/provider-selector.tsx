'use client';

import { Button } from '@/components/ui/button';
import { LOCAL_AI_PROVIDER_LABELS, LocalAIProvider } from '@/lib/local-ai';
import { cn } from '@/lib/utils';
import { Cpu, Zap } from 'lucide-react';

interface ProviderSelectorProps {
  value: LocalAIProvider | null;
  onValueChange: (provider: LocalAIProvider) => void;
  className?: string;
}

const PROVIDER_ICONS: Record<LocalAIProvider, typeof Cpu> = {
  ollama: Cpu,
  omlx: Zap,
};

export function ProviderSelector({ value, onValueChange, className }: ProviderSelectorProps) {
  return (
    <div className={cn('bg-muted grid w-full grid-cols-2 gap-1 rounded-xl p-1', className)}>
      {(Object.keys(LOCAL_AI_PROVIDER_LABELS) as LocalAIProvider[]).map((provider) => {
        const Icon = PROVIDER_ICONS[provider];
        const isActive = value === provider;

        return (
          <Button
            key={provider}
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => onValueChange(provider)}
            className={cn(
              'h-8 w-full justify-center gap-1.5 rounded-lg px-3 text-xs font-medium',
              isActive
                ? 'bg-background text-foreground hover:bg-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className='h-3.5 w-3.5' />
            {LOCAL_AI_PROVIDER_LABELS[provider]}
          </Button>
        );
      })}
    </div>
  );
}

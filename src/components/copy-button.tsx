'use client';

import { Check, Copy } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function CopyButton({ value, className, ...props }: React.ComponentProps<typeof Button> & { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [value]);

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

export { CopyButton };

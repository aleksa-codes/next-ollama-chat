'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='group bg-muted/50 relative my-3 overflow-hidden rounded-lg border'>
      <div className='bg-muted/30 flex items-center justify-between border-b px-3 py-1.5'>
        <span className='text-muted-foreground text-xs font-medium uppercase'>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className='text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors'
        >
          {copied ? (
            <>
              <Check className='h-3 w-3' />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className='h-3 w-3' />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className='overflow-x-auto p-3 text-sm'>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function createCodeBlockHtml(html: string): string {
  return `<div class="code-block-wrapper">${html}</div>`;
}

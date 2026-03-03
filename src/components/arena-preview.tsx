'use client';

import { extractCode } from '@/lib/arena';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ArenaPreviewProps {
  code: string;
  mode: string;
  className?: string;
}

export function ArenaPreview({ code, mode, className }: ArenaPreviewProps) {
  const html = useMemo(() => {
    const cleanCode = extractCode(code);

    let output = '';

    if (mode === 'p5') {
      output = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
            <style>
              body { margin: 0; padding: 0; overflow: hidden; background-color: #09090b; }
              canvas { display: block; }
            </style>
          </head>
          <body>
            <script>
              try {
                ${cleanCode}
              } catch (e) {
                console.error("P5 Error:", e);
              }
            </script>
          </body>
        </html>
      `;
    } else if (mode === 'svg') {
      output = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #09090b; }
              svg { max-width: 100%; max-height: 100%; width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            ${cleanCode}
          </body>
        </html>
      `;
    } else if (mode === 'html' || mode === 'three' || mode === 'website' || mode === 'games') {
      if (cleanCode.includes('<html') || cleanCode.includes('<!DOCTYPE')) {
        output = cleanCode;
      } else {
        output = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>body { margin: 0; background-color: #09090b; color: white; }</style>
            </head>
            <body>
              ${cleanCode}
            </body>
          </html>
        `;
      }
    }
    return output;
  }, [code, mode]);

  return (
    <div className={cn('bg-background/50 relative h-full w-full overflow-hidden', className)}>
      <iframe
        title='preview'
        srcDoc={html}
        className='h-full w-full border-0'
        sandbox='allow-scripts allow-downloads'
      />
    </div>
  );
}

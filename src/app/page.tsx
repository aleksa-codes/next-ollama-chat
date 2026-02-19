import { CopyButton } from '@/components/copy-button';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export default function Home() {
  const features = [
    'Next.js 16',
    'React Compiler',
    'TypeScript',
    'Tailwind CSS v4',
    'shadcn/ui',
    'Dark Mode',
    'Typography Plugin',
    'Lucide Icons',
    'Prettier & ESLint',
  ];

  return (
    <main className='flex min-h-screen flex-col items-center justify-between px-6 py-12'>
      <div className='w-full' />

      <div className='w-full max-w-2xl'>
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-5xl font-bold tracking-tight md:text-6xl'>next-start</h1>
          <p className='text-muted-foreground text-lg'>A minimal Next.js starter template.</p>
        </div>

        <div className='mb-12 flex justify-center gap-3'>
          <Button asChild variant='default' className='gap-2'>
            <a href='https://github.com/aleksa-codes/next-start' target='_blank' rel='noopener noreferrer'>
              <Github className='h-4 w-4' />
              GitHub
            </a>
          </Button>
          <ModeToggle />
        </div>

        <div className='mb-12'>
          <p className='text-muted-foreground mb-6 text-center text-sm'>Features</p>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
            {features.map((feature) => (
              <div
                key={feature}
                className='border-border rounded-full border px-4 py-2.5 text-center text-sm font-medium'
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className='group bg-card relative overflow-hidden rounded-lg border px-6 py-4 shadow-sm transition-all hover:shadow-md'>
          <div className='flex items-center justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <p className='text-muted-foreground mb-1.5 text-xs font-medium'>Get Started</p>
              <code className='block truncate font-mono text-sm'>
                git clone git@github.com:aleksa-codes/next-start.git
              </code>
            </div>
            <CopyButton value='git clone git@github.com:aleksa-codes/next-start.git' />
          </div>
        </div>
      </div>

      <footer className='text-muted-foreground text-center text-sm'>
        <a
          href='https://github.com/aleksa-codes'
          target='_blank'
          rel='noopener noreferrer'
          className='hover:text-foreground transition-colors'
        >
          Made by aleksa.codes
        </a>
      </footer>
    </main>
  );
}

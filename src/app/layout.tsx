import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'next-start: Next.js Starter Template',
  description:
    'A minimal Next.js 16 starter with Tailwind CSS v4, shadcn/ui, React Compiler, typography, dark mode, Prettier, and ESLint.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

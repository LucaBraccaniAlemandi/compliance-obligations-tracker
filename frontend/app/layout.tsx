import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { Check } from 'lucide-react';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { t } from './lib/strings';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: t.appName,
  description: 'Track compliance obligations, statuses, and deadlines.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b bg-card">
          <nav aria-label="Primary" className="flex items-center gap-3 px-6 py-3">
            <Link href="/obligations" className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
              >
                <Check className="size-4" />
              </span>
              <span className="text-base font-medium tracking-tight">{t.appName}</span>
            </Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

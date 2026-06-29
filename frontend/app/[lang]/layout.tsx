import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import '../globals.css';
import { Toaster } from '@/components/ui/sonner';
import { locales, hasLocale } from '@/app/lib/dictionaries/config';
import { getDictionary } from '@/app/lib/dictionaries/get';
import { DictionaryProvider } from '@/app/lib/dictionaries/provider';
import { LanguageSwitcher } from './language-switcher';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { t } = await getDictionary(lang);
  return {
    title: t.appName,
    description: 'Track compliance obligations, statuses, and deadlines.',
  };
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const { t } = dict;

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DictionaryProvider dict={dict} lang={lang}>
          <header className="sticky top-0 z-10 border-b bg-card">
            <nav aria-label="Primary" className="flex items-center gap-3 px-6 py-3">
              <Link href={`/${lang}/obligations`} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
                >
                  <Check className="size-4" />
                </span>
                <span className="text-base font-medium tracking-tight">{t.appName}</span>
              </Link>
              <div className="ml-auto">
                <LanguageSwitcher />
              </div>
            </nav>
          </header>
          <div className="flex-1">{children}</div>
          <Toaster position="bottom-right" />
        </DictionaryProvider>
      </body>
    </html>
  );
}

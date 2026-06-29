'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames, type Locale } from '@/app/lib/dictionaries/config';
import { useDictionary, useLang } from '@/app/lib/dictionaries/provider';

/**
 * Swaps the leading locale segment of the current path, preserving the rest of
 * the route and the query string so the user stays on the same page.
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = useLang();
  const { t } = useDictionary();
  const [, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === lang) return;
    // pathname always starts with `/<lang>` here; replace just that segment.
    const rest = pathname.replace(/^\/[^/]+/, '');
    startTransition(() => {
      router.push(`/${next}${rest}`);
    });
  }

  return (
    <Select value={lang} onValueChange={(v) => switchTo(v as Locale)}>
      <SelectTrigger size="sm" className="w-32" aria-label={t.language}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {localeNames[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

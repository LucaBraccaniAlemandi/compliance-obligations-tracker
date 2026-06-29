import 'server-only';

import { cookies } from 'next/headers';
import { defaultLocale, hasLocale, LOCALE_COOKIE, type Locale } from './config';
import { getDictionary } from './get';
import type { Dictionary } from './en';

/**
 * Resolves the request's locale from the cookie the proxy sets. Used by Server
 * Actions, which receive no route params and so cannot read `[lang]` directly.
 */
export async function getRequestLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && hasLocale(value) ? value : defaultLocale;
}

/** The dictionary for the current request's locale. */
export async function getRequestDictionary(): Promise<Dictionary> {
  return getDictionary(await getRequestLocale());
}

import 'server-only';

import { en, type Dictionary } from './en';
import { es } from './es';
import type { Locale } from './config';

/**
 * Server-only dictionary loader. Client components never call this — they read
 * the active dictionary from `DictionaryProvider` via `useDictionary()`. Keeping
 * this `server-only` ensures all locale data stays on the server, and only the
 * active locale's dictionary crosses to the client through the RSC payload.
 */
const dictionaries: Record<Locale, () => Dictionary> = {
  en: () => en,
  es: () => es,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

export type { Dictionary };

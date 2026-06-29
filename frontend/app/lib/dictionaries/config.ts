/**
 * Locale configuration shared across the server (proxy, dictionary loader) and
 * the client (provider, language switcher). Intentionally free of `server-only`
 * and of any dictionary data so it is safe to import from client components.
 */

export const locales = ['en', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * Cookie the proxy writes with the active locale, so server-only code that has
 * no route params in scope (Server Actions) can resolve the request's locale.
 */
export const LOCALE_COOKIE = 'LOCALE';

/** Display names for the language switcher, keyed by locale. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

/** Narrows an arbitrary string to a supported `Locale`. */
export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** BCP-47 tag used for `Intl` date/number formatting per locale. */
export const intlLocale: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
};

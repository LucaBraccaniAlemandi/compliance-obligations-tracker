'use client';

/**
 * Makes the active locale and its dictionary available to client components.
 * The server layout loads the dictionary (server-only) and passes it down once;
 * client components read it with `useDictionary()` / `useLang()` instead of
 * importing the static English strings.
 */

import { createContext, useContext } from 'react';
import type { Dictionary } from './en';
import type { Locale } from './config';

interface I18nValue {
  dict: Dictionary;
  lang: Locale;
}

const I18nContext = createContext<I18nValue | null>(null);

export function DictionaryProvider({
  dict,
  lang,
  children,
}: {
  dict: Dictionary;
  lang: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ dict, lang }}>{children}</I18nContext.Provider>
  );
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return value;
}

export function useDictionary(): Dictionary {
  return useI18n().dict;
}

export function useLang(): Locale {
  return useI18n().lang;
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Negotiator from 'negotiator';
import {
  locales,
  defaultLocale,
  LOCALE_COOKIE,
  type Locale,
} from '@/app/lib/dictionaries/config';

/**
 * Locale routing. Every page lives under `app/[lang]`, so a request without a
 * locale prefix (e.g. `/obligations`) is redirected to the best matching locale
 * (e.g. `/en/obligations`). The match uses the browser's `Accept-Language`
 * header, falling back to `defaultLocale`.
 */

function getLocale(request: NextRequest): Locale {
  const headers = { 'accept-language': request.headers.get('accept-language') ?? '' };
  const preferred = new Negotiator({ headers }).languages();

  for (const candidate of preferred) {
    // Match exact ("es") or primary subtag ("es-ES" -> "es").
    const base = candidate.toLowerCase().split('-')[0];
    const hit = locales.find((l) => l === candidate.toLowerCase() || l === base);
    if (hit) return hit;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const prefix = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  // Already localized: record the locale in a cookie for server-only code
  // (Server Actions) and continue.
  if (prefix) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, prefix, { path: '/', sameSite: 'lax' });
    return response;
  }

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', sameSite: 'lax' });
  return response;
}

export const config = {
  // Skip Next internals, API routes, and static assets (anything with a dot).
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

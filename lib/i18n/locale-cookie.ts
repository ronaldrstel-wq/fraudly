import { isLocale, type Locale } from "@/lib/i18n/locales";

export const LOCALE_COOKIE_NAME = "fraudly_locale";

export function readLocaleCookieValue(raw: string | undefined): Locale | null {
  if (raw && isLocale(raw)) return raw;
  return null;
}

/** Set on the client when the user picks a locale (mirrors localStorage). */
export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 400;
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)};path=/;max-age=${maxAge};samesite=lax`;
}

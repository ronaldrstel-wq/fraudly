import { writeLocaleCookie } from "@/lib/i18n/locale-cookie";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";

export const LOCALE_PREFERENCE_KEY = "fraudly_locale";

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCALE_PREFERENCE_KEY);
    if (raw && isLocale(raw)) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, locale);
    writeLocaleCookie(locale);
  } catch {
    /* ignore */
  }
}

export function clearStoredLocale(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCALE_PREFERENCE_KEY);
  } catch {
    /* ignore */
  }
}

/** Preference that should steer marketing navigation (never forces scan UI language). */
export function preferredMarketingLocale(): Locale {
  return readStoredLocale() ?? DEFAULT_LOCALE;
}

import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";
import { LOCALE_COOKIE_NAME, readLocaleCookieValue } from "@/lib/i18n/locale-cookie";
import { localeFromPathname } from "@/lib/i18n/paths";

/**
 * Locale for unprefixed `/check/[domain]` pages: stored preference, then Referer path, else English.
 */
export async function getCheckPageLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = readLocaleCookieValue(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  if (fromCookie) return fromCookie;

  const referer = (await headers()).get("referer");
  if (referer) {
    try {
      const { pathname } = new URL(referer);
      const fromReferer = localeFromPathname(pathname);
      if (fromReferer !== DEFAULT_LOCALE) return fromReferer;
    } catch {
      /* invalid referer */
    }
  }

  return DEFAULT_LOCALE;
}

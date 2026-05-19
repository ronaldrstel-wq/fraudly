import { headers } from "next/headers";
import { LOCALE_HTML_LANG, isLocale, type Locale } from "@/lib/i18n/locales";

export const REQUEST_LOCALE_HEADER = "x-fraudly-locale";

/** Server-only: locale from middleware-injected request header (falls back to en). */
export async function getRequestLocale(): Promise<Locale> {
  const raw = (await headers()).get(REQUEST_LOCALE_HEADER);
  return raw && isLocale(raw) ? raw : "en";
}

export async function getRequestHtmlLang(): Promise<string> {
  return LOCALE_HTML_LANG[await getRequestLocale()];
}

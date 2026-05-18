import {
  DEFAULT_LOCALE,
  type Locale,
  type LocalizedLocale,
  type LocalizedMarketingPath
} from "@/lib/i18n/locales";

/**
 * Build a locale-aware path. English keeps canonical unprefixed URLs.
 */
export function localizedPath(path: LocalizedMarketingPath | string, locale: Locale): string {
  const normalized = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) {
    return normalized;
  }
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

/** Strip a leading /nl|/de|/fr segment when present. */
export function stripLocalePrefix(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first === "nl" || first === "de" || first === "fr") {
    const rest = segments.slice(1).join("/");
    return { locale: first, path: rest ? `/${rest}` : "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

export function localeFromPathname(pathname: string): Locale {
  return stripLocalePrefix(pathname).locale;
}

/** Map Accept-Language hints to a localized locale (never forces redirect). */
export function suggestLocaleFromAcceptLanguage(header: string | null): LocalizedLocale | null {
  if (!header) return null;
  const lower = header.toLowerCase();
  if (lower.includes("nl")) return "nl";
  if (lower.includes("de")) return "de";
  if (lower.includes("fr")) return "fr";
  return null;
}

export function homeHref(locale: Locale): string {
  return localizedPath("/", locale);
}

/** Locale homepage scanner section — always root + hash, never the current path. */
export function homeScannerHref(locale: Locale): string {
  return `${homeHref(locale)}#link-check`;
}

/** True for `/`, `/nl`, `/de`, `/fr` (homepage variants only). */
export function isHomepagePath(pathname: string): boolean {
  return stripLocalePrefix(pathname || "/").path === "/";
}

/** Default English site has no URL prefix. */
export const DEFAULT_LOCALE = "en" as const;

export const LOCALIZED_LOCALES = ["nl", "de", "fr", "es", "pt"] as const;

export const LOCALES = [DEFAULT_LOCALE, ...LOCALIZED_LOCALES] as const;

export type Locale = (typeof LOCALES)[number];

export type LocalizedLocale = (typeof LOCALIZED_LOCALES)[number];

export function isLocalizedLocale(value: string): value is LocalizedLocale {
  return (LOCALIZED_LOCALES as readonly string[]).includes(value);
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  nl: "nl",
  de: "de",
  fr: "fr",
  es: "es",
  pt: "pt"
};

export const LOCALE_OG: Record<Locale, string> = {
  en: "en_US",
  nl: "nl_NL",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  pt: "pt_PT"
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português"
};

export const LOCALE_SWITCHER_CODES: Record<Locale, string> = {
  en: "EN",
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  pt: "PT"
};

/** Static marketing paths that have localized versions. */
export const LOCALIZED_MARKETING_PATHS = [
  "/",
  "/about",
  "/scam-help",
  "/scam-alerts",
  "/latest-checks",
  "/support"
] as const;

export type LocalizedMarketingPath = (typeof LOCALIZED_MARKETING_PATHS)[number];

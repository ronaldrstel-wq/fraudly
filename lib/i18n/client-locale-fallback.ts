import { en } from "@/lib/i18n/dictionaries/en";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import { marketingUiEn } from "@/lib/i18n/marketing-ui-en";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/** English dictionary for client hooks when no LocaleProvider is mounted. */
export const CLIENT_LOCALE_FALLBACK: { locale: Locale; dict: Dictionary } = {
  locale: DEFAULT_LOCALE,
  dict: { ...en, ...marketingUiEn } as Dictionary
};

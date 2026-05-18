import { de } from "@/lib/i18n/dictionaries/de";
import { en } from "@/lib/i18n/dictionaries/en";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { nl } from "@/lib/i18n/dictionaries/nl";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import { getMarketingUi } from "@/lib/i18n/marketing-ui";
import type { Locale } from "@/lib/i18n/locales";

const dictionaries = { en, nl, de, fr } as const;

export function getDictionary(locale: Locale): Dictionary {
  const base = dictionaries[locale] ?? en;
  return { ...base, ...getMarketingUi(locale) } as Dictionary;
}

export type { Dictionary } from "@/lib/i18n/dictionary-types";

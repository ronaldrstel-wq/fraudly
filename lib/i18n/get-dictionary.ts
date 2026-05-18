import { de } from "@/lib/i18n/dictionaries/de";
import { en } from "@/lib/i18n/dictionaries/en";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { nl } from "@/lib/i18n/dictionaries/nl";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  nl,
  de,
  fr
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary } from "@/lib/i18n/dictionary-types";

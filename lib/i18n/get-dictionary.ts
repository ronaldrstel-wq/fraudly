import { de } from "@/lib/i18n/dictionaries/de";
import { en } from "@/lib/i18n/dictionaries/en";
import { es } from "@/lib/i18n/dictionaries/es";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { nl } from "@/lib/i18n/dictionaries/nl";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { CoreDictionary, Dictionary } from "@/lib/i18n/dictionary-types";
import type { MarketingUiExtension } from "@/lib/i18n/marketing-ui-types";
import { deepMergeDictionary } from "@/lib/i18n/merge-dictionary";
import { getMarketingUi } from "@/lib/i18n/marketing-ui";
import type { Locale } from "@/lib/i18n/locales";

const dictionaries = { en, nl, de, fr, es, pt } as const;

export function getDictionary(locale: Locale): Dictionary {
  const core: CoreDictionary =
    locale === "en" ? dictionaries.en : deepMergeDictionary(dictionaries.en, dictionaries[locale] ?? {});
  const marketing: MarketingUiExtension =
    locale === "en"
      ? getMarketingUi("en")
      : deepMergeDictionary(getMarketingUi("en"), getMarketingUi(locale) as Partial<MarketingUiExtension>);
  return { ...core, ...marketing } as Dictionary;
}

export type { Dictionary } from "@/lib/i18n/dictionary-types";

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localizedPath } from "@/lib/i18n/paths";
import { LOCALE_LABELS, type LocalizedLocale } from "@/lib/i18n/locales";
import { readStoredLocale } from "@/lib/i18n/locale-preference";
import { useLocale } from "@/components/i18n/LocaleProvider";

const DISMISS_KEY = "fraudly-locale-banner-dismiss";

const BANNER_COPY: Record<
  "en" | LocalizedLocale,
  { prefer: (language: string) => string; viewIn: (language: string) => string }
> = {
  en: {
    prefer: (language) => `Prefer ${language}?`,
    viewIn: (language) => `View in ${language}`
  },
  nl: {
    prefer: (language) => `Liever ${language}?`,
    viewIn: (language) => `Bekijk in het ${language}`
  },
  de: {
    prefer: (language) => `${language} bevorzugen?`,
    viewIn: (language) => `Auf ${language} ansehen`
  },
  fr: {
    prefer: (language) => `Préférez le ${language} ?`,
    viewIn: (language) => `Voir en ${language}`
  },
  es: {
    prefer: (language) => `¿Prefieres ${language}?`,
    viewIn: (language) => `Ver en ${language}`
  },
  pt: {
    prefer: (language) => `Prefere ${language}?`,
    viewIn: (language) => `Ver em ${language}`
  }
};

type LocaleSuggestionBannerProps = {
  suggestedLocale: LocalizedLocale;
  marketingPath: "/" | "/about" | "/scam-help" | "/scam-alerts" | "/latest-checks" | "/support";
};

export function LocaleSuggestionBanner({ suggestedLocale, marketingPath }: LocaleSuggestionBannerProps) {
  const { locale, dict } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (locale !== "en") return;
    const stored = readStoredLocale();
    if (stored && stored !== "en") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [locale]);

  if (!visible || locale !== "en") return null;

  const languageLabel = LOCALE_LABELS[suggestedLocale];
  const href = localizedPath(marketingPath, suggestedLocale);
  const copy = BANNER_COPY.en;

  return (
    <div
      className="border-b border-blue-100 bg-blue-50/90 px-4 py-2.5 text-center text-sm text-slate-800"
      role="region"
      aria-label="Language suggestion"
    >
      <span>{copy.prefer(languageLabel)} </span>
      <Link href={href} className="font-semibold text-blue-700 underline-offset-2 hover:underline">
        {copy.viewIn(languageLabel)}
      </Link>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
        className="ml-3 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        {dict.localeBanner.dismiss}
      </button>
    </div>
  );
}

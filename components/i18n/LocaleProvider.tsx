"use client";

import { createContext, useContext, type ReactNode } from "react";
import { CLIENT_LOCALE_FALLBACK } from "@/lib/i18n/client-locale-fallback";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

export function useLocaleOptional(): LocaleContextValue | null {
  return useContext(LocaleContext);
}

/** Full locale context, or English fallback — never throws on missing provider. */
export function useLocale(): LocaleContextValue {
  return useLocaleOptional() ?? CLIENT_LOCALE_FALLBACK;
}

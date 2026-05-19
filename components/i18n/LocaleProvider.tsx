"use client";

import { createContext, useContext, type ReactNode } from "react";
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

export function useLocale(): LocaleContextValue {
  const ctx = useLocaleOptional();
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

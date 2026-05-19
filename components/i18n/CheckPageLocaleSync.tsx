"use client";

import { useEffect } from "react";
import { writeStoredLocale } from "@/lib/i18n/locale-preference";
import type { Locale } from "@/lib/i18n/locales";

/** Persists locale on `/check/[domain]` so return visits honor the user’s language. */
export function CheckPageLocaleSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    writeStoredLocale(locale);
  }, [locale]);
  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LOCALE_HTML_LANG } from "@/lib/i18n/locales";
import { localeFromPathname } from "@/lib/i18n/paths";

/**
 * Keeps document.documentElement.lang in sync on client navigations
 * (root layout may not re-run on soft route changes).
 */
export function DocumentLangSync() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const locale = localeFromPathname(pathname);
    const lang = LOCALE_HTML_LANG[locale];
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
  }, [pathname]);

  return null;
}

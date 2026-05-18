"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readStoredLocale, writeStoredLocale } from "@/lib/i18n/locale-preference";
import { localizedPath, stripLocalePrefix } from "@/lib/i18n/paths";
import { LOCALIZED_MARKETING_PATHS, type LocalizedMarketingPath } from "@/lib/i18n/locales";

function isMarketingPath(path: string): path is LocalizedMarketingPath {
  return (LOCALIZED_MARKETING_PATHS as readonly string[]).includes(path);
}

/**
 * Persists URL locale to localStorage and redirects English marketing URLs
 * to the user's stored preference when a localized equivalent exists.
 */
export function LocalePreferenceSync() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    const { locale, path } = stripLocalePrefix(pathname);
    if (locale !== "en") {
      writeStoredLocale(locale);
      return;
    }
    if (isMarketingPath(path)) {
      writeStoredLocale(locale);
    }
  }, [pathname]);

  useEffect(() => {
    if (redirectingRef.current) return;
    const { locale, path } = stripLocalePrefix(pathname);
    if (!isMarketingPath(path) || locale !== "en") return;

    const stored = readStoredLocale();
    if (!stored || stored === "en") return;

    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const target = `${localizedPath(path, stored)}${suffix}`;
    if (target === pathname || target === `${pathname}${suffix}`) return;

    redirectingRef.current = true;
    router.replace(target);
  }, [pathname, router, searchParams]);

  return null;
}

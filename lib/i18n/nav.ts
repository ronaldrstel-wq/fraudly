import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

export type NavLink = { label: string; href: string };

/** Primary top navbar — kept minimal for NL/DE/FR; Learn/About live in the footer. */
export function getMainNavLinks(locale: Locale, dict: Dictionary): NavLink[] {
  return [
    { label: dict.nav.latestChecks, href: localizedPath("/latest-checks", locale) },
    { label: dict.nav.scamAlerts, href: localizedPath("/scam-alerts", locale) },
    { label: dict.nav.support, href: localizedPath("/support", locale) }
  ];
}

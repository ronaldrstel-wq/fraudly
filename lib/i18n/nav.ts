import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

export type NavLink = { label: string; href: string };

/** Primary marketing nav with locale-aware hrefs for localized static pages. */
export function getMainNavLinks(locale: Locale, dict: Dictionary): NavLink[] {
  return [
    { label: dict.nav.latestChecks, href: localizedPath("/latest-checks", locale) },
    { label: dict.nav.pulse, href: "/pulse" },
    { label: dict.nav.scamAlerts, href: localizedPath("/scam-alerts", locale) },
    { label: dict.nav.howItWorks, href: "/how-it-works" },
    { label: dict.nav.features, href: "/features" },
    { label: dict.nav.learn, href: "/learn" },
    { label: dict.nav.about, href: localizedPath("/about", locale) }
  ];
}

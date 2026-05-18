import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getMainNavLinks } from "@/lib/i18n/nav";
import type { Locale } from "@/lib/i18n/locales";

/** @deprecated Use getMainNavLinks(locale, dict) — kept for gradual migration. */
export const MAIN_NAV_LINKS = getMainNavLinks("en", getDictionary("en"));

export { getMainNavLinks };

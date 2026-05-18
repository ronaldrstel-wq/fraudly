import type { Metadata } from "next";
import { warnMetaDescriptionIfNeeded } from "@/lib/seo-description";
import { defaultKeywords, publicRobots, SITE_URL } from "@/lib/seo";
import { OG_IMAGE } from "@/lib/seo-metadata";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import { DEFAULT_LOCALE, LOCALE_OG, LOCALES, type Locale, type LocalizedMarketingPath } from "@/lib/i18n/locales";

export type LocalizedMetaKey = keyof Dictionary["meta"];

/** Normalize `?page=2` or `page=2` into a query suffix (empty when none). */
export function normalizeSearchSuffix(searchSuffix = ""): string {
  if (!searchSuffix) return "";
  return searchSuffix.startsWith("?") ? searchSuffix : `?${searchSuffix}`;
}

/** hreflang map for a marketing path (en, nl, de, fr, x-default). English URLs stay unprefixed. */
export function hreflangLanguages(path: LocalizedMarketingPath, searchSuffix = ""): Record<string, string> {
  const suffix = normalizeSearchSuffix(searchSuffix);
  const languages: Record<string, string> = {
    "x-default": `${SITE_URL}${localizedPath(path, DEFAULT_LOCALE)}${suffix}`
  };
  for (const locale of LOCALES) {
    languages[locale] = `${SITE_URL}${localizedPath(path, locale)}${suffix}`;
  }
  return languages;
}

/** Canonical URL for a locale + marketing path (optional query string). */
export function localizedCanonicalUrl(
  path: LocalizedMarketingPath,
  locale: Locale,
  searchSuffix = ""
): string {
  return `${SITE_URL}${localizedPath(path, locale)}${normalizeSearchSuffix(searchSuffix)}`;
}

/** Build metadata using the active locale dictionary with hreflang alternates. */
export function buildLocalizedPageMetadataFromDict(
  locale: Locale,
  path: LocalizedMarketingPath,
  dict: Dictionary,
  metaKey: LocalizedMetaKey,
  options?: { titleAbsolute?: boolean; searchSuffix?: string }
): Metadata {
  const meta = dict.meta[metaKey];
  const titleSegment = meta.title;
  const description = meta.description;
  const url = localizedCanonicalUrl(path, locale, options?.searchSuffix);
  const titleAbsolute = options?.titleAbsolute ?? meta.title.includes("| Fraudly");
  const sharingTitle = titleAbsolute ? titleSegment : `${titleSegment} | Fraudly`;

  warnMetaDescriptionIfNeeded(localizedPath(path, locale) + normalizeSearchSuffix(options?.searchSuffix), description);

  return {
    title: titleAbsolute ? { absolute: titleSegment } : titleSegment,
    description,
    keywords: [...defaultKeywords],
    robots: publicRobots,
    alternates: {
      canonical: url,
      languages: hreflangLanguages(path, options?.searchSuffix)
    },
    openGraph: {
      type: "website",
      siteName: "Fraudly",
      locale: LOCALE_OG[locale],
      url,
      title: sharingTitle,
      description,
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: sharingTitle,
      description,
      images: [OG_IMAGE.url]
    }
  };
}

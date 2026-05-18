import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildLocalizedPageMetadataFromDict, type LocalizedMetaKey } from "@/lib/i18n/seo";
import type { LocalizedLocale, LocalizedMarketingPath } from "@/lib/i18n/locales";

export function localizedPageMetadata(
  locale: LocalizedLocale,
  path: LocalizedMarketingPath,
  metaKey: LocalizedMetaKey,
  options?: { searchSuffix?: string; titleAbsolute?: boolean }
) {
  const dict = getDictionary(locale);
  return buildLocalizedPageMetadataFromDict(locale, path, dict, metaKey, {
    titleAbsolute: options?.titleAbsolute ?? (metaKey === "home" || metaKey === "support"),
    searchSuffix: options?.searchSuffix
  });
}

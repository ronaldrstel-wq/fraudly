import { localizedPath } from "@/lib/i18n/paths";
import { LOCALES, LOCALIZED_MARKETING_PATHS } from "@/lib/i18n/locales";

/** All indexable marketing URLs including localized variants. */
export function allLocalizedMarketingUrls(): string[] {
  const paths: string[] = [];
  for (const locale of LOCALES) {
    for (const path of LOCALIZED_MARKETING_PATHS) {
      paths.push(localizedPath(path, locale));
    }
  }
  return paths;
}

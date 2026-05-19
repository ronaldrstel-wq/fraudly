import { headers } from "next/headers";
import { LocaleSuggestionLazy } from "@/components/i18n/LocaleSuggestionLazy";
import { suggestLocaleFromAcceptLanguage } from "@/lib/i18n/paths";
import type { LocalizedMarketingPath } from "@/lib/i18n/locales";

export async function LocaleSuggestionServer({ marketingPath }: { marketingPath: LocalizedMarketingPath }) {
  const acceptLanguage = (await headers()).get("accept-language");
  const suggested = suggestLocaleFromAcceptLanguage(acceptLanguage);
  if (!suggested) return null;
  return <LocaleSuggestionLazy suggestedLocale={suggested} marketingPath={marketingPath} />;
}

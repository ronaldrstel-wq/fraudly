import { headers } from "next/headers";
import { LocaleSuggestionBanner } from "@/components/i18n/LocaleSuggestionBanner";
import { suggestLocaleFromAcceptLanguage } from "@/lib/i18n/paths";
import type { LocalizedMarketingPath } from "@/lib/i18n/locales";

export async function LocaleSuggestionServer({ marketingPath }: { marketingPath: LocalizedMarketingPath }) {
  const acceptLanguage = (await headers()).get("accept-language");
  const suggested = suggestLocaleFromAcceptLanguage(acceptLanguage);
  if (!suggested) return null;
  return <LocaleSuggestionBanner suggestedLocale={suggested} marketingPath={marketingPath} />;
}

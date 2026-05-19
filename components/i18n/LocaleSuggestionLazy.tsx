"use client";

import dynamic from "next/dynamic";
import type { LocalizedLocale } from "@/lib/i18n/locales";

const LocaleSuggestionBanner = dynamic(
  () => import("@/components/i18n/LocaleSuggestionBanner").then((m) => ({ default: m.LocaleSuggestionBanner })),
  { ssr: false }
);

export function LocaleSuggestionLazy({
  suggestedLocale,
  marketingPath
}: {
  suggestedLocale: LocalizedLocale;
  marketingPath: import("@/lib/i18n/locales").LocalizedMarketingPath;
}) {
  return <LocaleSuggestionBanner suggestedLocale={suggestedLocale} marketingPath={marketingPath} />;
}

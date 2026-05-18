"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { homeScannerHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";
import { marketingNavScanCtaClass } from "@/lib/i18n/typography";

type MarketingNavScanCtaProps = {
  /** Prefer explicit locale from the navbar shell when context is unavailable. */
  locale?: Locale;
};

/** Primary check action — always links to the locale homepage `#link-check` section. */
export function MarketingNavScanCta({ locale: localeProp }: MarketingNavScanCtaProps) {
  const { locale: contextLocale, dict } = useLocale();
  const locale = localeProp ?? contextLocale;

  return (
    <Link href={homeScannerHref(locale)} className={marketingNavScanCtaClass(locale)}>
      {dict.homepage.primaryCta}
    </Link>
  );
}

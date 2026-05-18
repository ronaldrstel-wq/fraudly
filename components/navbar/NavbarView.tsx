"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { AuthMenuDynamic } from "@/components/navbar/AuthMenuDynamic";
import { MarketingNavLinks } from "@/components/navbar/MarketingNavLinks";
import { MarketingNavScanCta } from "@/components/navbar/MarketingNavScanCta";
import { getMainNavLinks } from "@/lib/i18n/nav";
import { homeHref } from "@/lib/i18n/paths";

type NavbarViewProps = {
  /** Homepage-only: language dropdown (desktop). */
  languageSwitcher?: ReactNode;
  /** Homepage-only: labeled language row (mobile). */
  languageMobileRow?: ReactNode;
};

export function NavbarView({ languageSwitcher = null, languageMobileRow = null }: NavbarViewProps) {
  const { locale, dict } = useLocale();
  const links = getMainNavLinks(locale, dict);

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-3">
        <Link href={homeHref(locale)} className="mr-1 inline-flex shrink-0 items-center opacity-90 transition-opacity hover:opacity-100 sm:mr-2">
          <Image
            src="/logo.png"
            alt="Fraudly — scam and fraud checker"
            width={120}
            height={40}
            sizes="120px"
            className="h-8 w-auto object-contain md:h-9"
          />
        </Link>

        <MarketingNavLinks locale={locale} links={links} />

        <div className="flex min-h-9 min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-2.5 md:gap-3">
          <MarketingNavScanCta locale={locale} />
          {languageSwitcher}
          <AuthMenuDynamic />
        </div>
      </div>
      {languageMobileRow}
    </nav>
  );
}

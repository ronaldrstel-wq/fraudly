"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import { AuthMenuDynamic } from "@/components/navbar/AuthMenuDynamic";
import { MarketingNavLinks, type MarketingNavLink } from "@/components/navbar/MarketingNavLinks";
import { homeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

export type { MarketingNavLink };

type NavbarViewProps = {
  locale: Locale;
  dict: Dictionary;
  links: MarketingNavLink[];
  /** Homepage-only: language dropdown (desktop). */
  languageSwitcher?: ReactNode;
  /** Homepage-only: labeled language row (mobile). */
  languageMobileRow?: ReactNode;
};

export function NavbarView({
  locale,
  dict,
  links,
  languageSwitcher = null,
  languageMobileRow = null
}: NavbarViewProps) {

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

        <div className="flex min-h-9 min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {languageSwitcher}
          <AuthMenuDynamic locale={locale} auth={dict.auth} />
        </div>
      </div>
      {languageMobileRow}
    </nav>
  );
}

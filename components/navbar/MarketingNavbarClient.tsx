"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n/dictionary-types";
import type { Locale } from "@/lib/i18n/locales";
import { NavbarView, type MarketingNavLink } from "@/components/navbar/NavbarView";

const LanguageDropdown = dynamic(
  () => import("@/components/i18n/LanguageDropdown").then((m) => ({ default: m.LanguageDropdown })),
  { ssr: false, loading: () => <span className="inline-block h-9 w-24 rounded-lg bg-slate-100" aria-hidden /> }
);

function LanguageMobileRow({ languageLabel }: { languageLabel: string }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 border-t border-slate-100/80 px-4 py-2.5 md:hidden">
      <span className="text-xs font-semibold text-slate-500">{languageLabel}</span>
      <LanguageDropdown />
    </div>
  );
}

/** Marketing navbar with language switcher on all localized marketing routes (`/about`, `/nl/...`, etc.). */
export function MarketingNavbarClient({
  locale,
  dict,
  links
}: {
  locale: Locale;
  dict: Dictionary;
  links: MarketingNavLink[];
}) {
  return (
    <NavbarView
      locale={locale}
      dict={dict}
      links={links}
      languageSwitcher={
        <div className="max-md:hidden">
          <LanguageDropdown />
        </div>
      }
      languageMobileRow={<LanguageMobileRow languageLabel={dict.common.languageLabel} />}
    />
  );
}

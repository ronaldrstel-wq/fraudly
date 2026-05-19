"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NavbarView } from "@/components/navbar/NavbarView";
import { getMainNavLinks } from "@/lib/i18n/nav";

const LanguageDropdown = dynamic(
  () => import("@/components/i18n/LanguageDropdown").then((m) => ({ default: m.LanguageDropdown })),
  { ssr: false, loading: () => <span className="inline-block h-9 w-24 rounded-lg bg-slate-100" aria-hidden /> }
);

function HomeLanguageMobileRow({ languageLabel }: { languageLabel: string }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 border-t border-slate-100/80 px-4 py-2.5 md:hidden">
      <span className="text-xs font-semibold text-slate-500">{languageLabel}</span>
      <LanguageDropdown />
    </div>
  );
}

/** Homepage navbar (`/`, `/nl`, `/de`, `/fr`) — includes the language dropdown. */
export function HomeNavbar() {
  const { locale, dict } = useLocale();
  const links = useMemo(() => getMainNavLinks(locale, dict), [locale, dict]);

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
      languageMobileRow={<HomeLanguageMobileRow languageLabel={dict.common.languageLabel} />}
    />
  );
}

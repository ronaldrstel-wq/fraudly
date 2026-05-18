"use client";

import { LanguageDropdown } from "@/components/i18n/LanguageDropdown";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NavbarView } from "@/components/navbar/NavbarView";

function HomeLanguageMobileRow() {
  const { dict } = useLocale();

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 border-t border-slate-100/80 px-4 py-2.5 md:hidden">
      <span className="text-xs font-semibold text-slate-500">{dict.common.languageLabel}</span>
      <LanguageDropdown />
    </div>
  );
}

/** Homepage navbar (`/`, `/nl`, `/de`, `/fr`) — includes the language dropdown. */
export function HomeNavbar() {
  return (
    <NavbarView
      languageSwitcher={
        <div className="max-md:hidden">
          <LanguageDropdown />
        </div>
      }
      languageMobileRow={<HomeLanguageMobileRow />}
    />
  );
}

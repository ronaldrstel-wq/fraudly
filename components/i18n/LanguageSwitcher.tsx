"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizedPath, stripLocalePrefix } from "@/lib/i18n/paths";
import { LOCALE_SWITCHER_CODES, LOCALES, type Locale } from "@/lib/i18n/locales";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/";
  const { locale: currentLocale } = useLocale();
  const { path } = stripLocalePrefix(pathname);

  const marketingPath =
    path === "/" ||
    path === "/about" ||
    path === "/scam-help" ||
    path === "/scam-alerts" ||
    path === "/latest-checks" ||
    path === "/support"
      ? path
      : null;

  if (!marketingPath) return null;

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg border border-slate-200/90 bg-white/95 p-0.5 text-[11px] font-semibold shadow-sm ${className}`}
      role="navigation"
      aria-label="Language"
    >
      {LOCALES.map((locale) => {
        const href = localizedPath(marketingPath, locale);
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            className={`rounded-md px-2 py-1 transition ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {LOCALE_SWITCHER_CODES[locale]}
          </Link>
        );
      })}
    </div>
  );
}

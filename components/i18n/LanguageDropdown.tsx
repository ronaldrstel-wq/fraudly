"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { writeStoredLocale } from "@/lib/i18n/locale-preference";
import { localizedPath, stripLocalePrefix } from "@/lib/i18n/paths";
import {
  LOCALE_LABELS,
  LOCALE_SWITCHER_CODES,
  LOCALES,
  LOCALIZED_MARKETING_PATHS,
  type Locale,
  type LocalizedMarketingPath
} from "@/lib/i18n/locales";

function isMarketingPath(path: string): path is LocalizedMarketingPath {
  return (LOCALIZED_MARKETING_PATHS as readonly string[]).includes(path);
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function ChevronIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type LanguageDropdownProps = {
  className?: string;
};

export function LanguageDropdown({ className = "" }: LanguageDropdownProps) {
  const pathname = usePathname() || "/";
  const { locale: currentLocale, path: strippedPath } = stripLocalePrefix(pathname);
  const marketingPath = isMarketingPath(strippedPath) ? strippedPath : null;
  const [open, setOpen] = useState(false);
  const [querySuffix, setQuerySuffix] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    setQuerySuffix(typeof window !== "undefined" ? window.location.search : "");
  }, [pathname]);

  const hrefForLocale = useCallback(
    (locale: Locale) => {
      const targetPath = marketingPath ?? "/";
      return `${localizedPath(targetPath, locale)}${querySuffix}`;
    },
    [marketingPath, querySuffix]
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!marketingPath) return null;

  const trigger = (
    <button
      type="button"
      className="fraudly-focus inline-flex h-9 min-w-[4.25rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/80 px-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-slate-300/90 hover:bg-slate-50/95"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-label={`Language: ${LOCALE_LABELS[currentLocale]}`}
      onClick={() => setOpen((prev) => !prev)}
    >
      <GlobeIcon className="h-4 w-4 shrink-0 text-slate-500" />
      <span>{LOCALE_SWITCHER_CODES[currentLocale]}</span>
      <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" open={open} />
    </button>
  );

  const panel = open ? (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Select language"
      className="absolute right-0 top-full z-50 mt-2 w-[11.25rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100/80"
    >
      {LOCALES.map((locale) => {
        const active = locale === currentLocale;
        return (
          <li key={locale} role="option" aria-selected={active}>
            <Link
              href={hrefForLocale(locale)}
              hrefLang={locale}
              className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm transition ${
                active
                  ? "bg-slate-900 font-semibold text-white"
                  : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={() => {
                writeStoredLocale(locale);
                setOpen(false);
              }}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              <span className={`text-xs ${active ? "text-slate-300" : "text-slate-400"}`}>
                {LOCALE_SWITCHER_CODES[locale]}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div className={`relative shrink-0 ${className}`} ref={containerRef}>
      {trigger}
      {panel}
    </div>
  );
}

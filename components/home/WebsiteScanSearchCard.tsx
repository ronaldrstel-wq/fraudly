"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { homeScanCtaButtonClass } from "@/lib/i18n/typography";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { HomeSearchCardState } from "@/lib/scan/homeScanProgress";

function ArrowRightGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10h12m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.5 10.2 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type WebsiteScanSearchCardProps = {
  state: HomeSearchCardState;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  primaryCtaLabel: string;
  /** Slightly smaller CTA when label is longer (NL/DE/FR). */
  compactCta?: boolean;
  scanProgress: number;
  scanStatus: string;
  scanFailed?: boolean;
  checkedLabel?: string | null;
};

export function WebsiteScanSearchCard({
  state,
  value,
  onChange,
  onSubmit,
  disabled = false,
  primaryCtaLabel,
  compactCta = false,
  scanProgress,
  scanStatus,
  scanFailed = false,
  checkedLabel
}: WebsiteScanSearchCardProps) {
  const { dict } = useLocale();
  const flow = dict.checkFlow;
  const inputRef = useRef<HTMLInputElement>(null);
  const clampedProgress = Math.min(100, Math.max(0, Math.round(scanProgress)));
  const displayDomain = checkedLabel?.trim() || value.trim() || null;
  const isScanning = state === "scanning";
  const isComplete = state === "complete";

  const inputCommon = {
    id: "fraudly-url-input" as const,
    type: "text" as const,
    inputMode: "url" as const,
    autoComplete: "url" as const,
    spellCheck: false,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!disabled && !isScanning) handleSubmit();
      }
    },
    placeholder: flow.check.urlPlaceholder
  };

  function handleSubmit() {
    inputRef.current?.blur();
    onSubmit();
  }

  useEffect(() => {
    if (isScanning) inputRef.current?.blur();
  }, [isScanning]);

  return (
    <div
      className={`scan-search-card fraudly-motion mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6 ${
        isComplete ? "scan-search-card--complete" : ""
      } ${isScanning ? "scan-search-card--scanning" : ""}`}
      data-state={state}
    >
      <div className="scan-search-card__viewport relative min-h-[4.5rem] sm:min-h-[4rem]">
        <div
          className={`scan-search-card__panel ${state === "idle" ? "scan-search-card__panel--active" : ""}`}
          aria-hidden={state !== "idle"}
        >
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="min-w-0 flex-1">
              <label htmlFor="fraudly-url-input" className="sr-only">
                {flow.check.urlFieldLabel}
              </label>
              <input
                {...inputCommon}
                ref={inputRef}
                aria-label={flow.check.urlFieldLabel}
                disabled={isScanning}
                className="h-16 min-h-[4rem] w-full min-w-0 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-sky-50 to-violet-50 px-6 text-lg text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-blue-300/90 focus:ring-4 focus:ring-blue-100/80 disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || isScanning}
              className={`${homeScanCtaButtonClass(compactCta ? "nl" : DEFAULT_LOCALE)} group`}
            >
              {primaryCtaLabel}
              <ArrowRightGlyph className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5 sm:h-[1.15rem] sm:w-[1.15rem]" />
            </button>
          </div>
        </div>

        <div
          className={`scan-search-card__panel scan-search-card__panel--scanning ${
            isScanning ? "scan-search-card__panel--active" : ""
          }`}
          aria-hidden={!isScanning}
        >
          <div className="flex min-h-[4rem] flex-col justify-center py-0.5">
            {displayDomain ? (
              <p className="mb-2 truncate text-center text-xs font-medium text-slate-500 sm:text-left">
                Scanning <span className="font-semibold text-slate-700">{displayDomain}</span>
              </p>
            ) : null}
            <p
              className={`text-center text-sm font-medium sm:text-left ${scanFailed ? "text-rose-800" : "text-slate-800"}`}
              id="home-scan-status"
            >
              {scanStatus}
            </p>
            <div
              className="mt-3 flex items-center gap-3"
              aria-live="polite"
              aria-atomic="true"
              aria-relevant="additions text"
            >
              <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/90">
                <div
                  role="progressbar"
                  aria-labelledby="home-scan-status"
                  aria-valuenow={clampedProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${clampedProgress} percent. ${scanStatus}`}
                  className={`scan-search-card__bar h-full rounded-full ${
                    scanFailed ? "bg-rose-400" : "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600"
                  }`}
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
              <span
                className={`shrink-0 tabular-nums text-sm font-semibold tracking-tight ${
                  scanFailed ? "text-rose-700" : "text-slate-700"
                }`}
              >
                {clampedProgress}%
              </span>
            </div>
          </div>
        </div>

        <div
          className={`scan-search-card__panel scan-search-card__panel--complete ${
            isComplete ? "scan-search-card__panel--active" : ""
          }`}
          aria-hidden={!isComplete}
        >
          <div className="flex min-h-[3.25rem] items-center justify-center gap-3 sm:justify-start">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckGlyph className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900">{flow.scanProgress.complete}</p>
              {displayDomain ? <p className="mt-0.5 truncate text-xs text-slate-500">{displayDomain}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
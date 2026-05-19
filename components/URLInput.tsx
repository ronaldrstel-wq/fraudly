"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useResultFlow } from "@/components/i18n/useResultFlow";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Shown under the field for context (homepage). */
  helperText?: string;
  /** Primary button label when not loading. */
  primaryCtaLabel?: string;
  /** Button label while loading. */
  loadingLabel?: string;
  /** Homepage: premium shell & larger prominence. */
  variant?: "standard" | "hero";
}

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

export function URLInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  helperText,
  primaryCtaLabel = "Check website",
  loadingLabel = "Checking website...",
  variant = "standard"
}: URLInputProps) {
  const flow = useResultFlow();
  const isHero = variant === "hero";

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
        if (!disabled && !loading) onSubmit();
      }
    },
    placeholder: flow.check.urlPlaceholder
  };

  const shellInner = (
    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
      <div className="min-w-0 flex-1">
        <label htmlFor="fraudly-url-input" className="mb-1 block text-left text-sm font-medium text-slate-700">
          {flow.check.urlFieldLabel}
        </label>
        {helperText ? (
          <p className="mb-1.5 text-left text-xs leading-relaxed text-slate-500 sm:text-[13px]">{helperText}</p>
        ) : null}
        <input {...inputCommon} className="fraudly-search-field" />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="btn-primary-lg group"
      >
        {loading ? loadingLabel : primaryCtaLabel}
        {!loading ? (
          <ArrowRightGlyph className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5 sm:h-[1.15rem] sm:w-[1.15rem]" />
        ) : null}
      </button>
    </div>
  );

  if (isHero) {
    return (
      <div className="fraudly-motion mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6">
        {helperText ? <p className="mb-3 text-sm text-slate-500">{helperText}</p> : null}
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1">
            <label htmlFor="fraudly-url-input" className="sr-only">
              {flow.check.urlFieldLabel}
            </label>
            <input
              {...inputCommon}
              aria-label={flow.check.urlFieldLabel}
              className="h-16 min-h-[4rem] w-full min-w-0 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-sky-50 to-violet-50 px-6 text-lg text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-blue-300/90 focus:ring-4 focus:ring-blue-100/80"
            />
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || loading}
            className="fraudly-motion fraudly-focus-on-white group inline-flex h-16 min-h-[4rem] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-[220px]"
          >
            {loading ? loadingLabel : primaryCtaLabel}
            {!loading ? (
              <ArrowRightGlyph className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5 sm:h-[1.15rem] sm:w-[1.15rem]" />
            ) : null}
          </button>
        </div>
      </div>
    );
  }

  return <div className="fraudly-search-shell w-full">{shellInner}</div>;
}

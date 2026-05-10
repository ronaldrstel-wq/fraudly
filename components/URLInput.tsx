"use client";

import { EN_MESSAGES } from "@/lib/messages.en";

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
  const isHero = variant === "hero";

  const shellInner = (
    <div
      className={`flex w-full flex-col sm:flex-row sm:items-stretch ${isHero ? "gap-3" : "gap-2.5 sm:gap-3"}`}
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor="fraudly-url-input"
          className={`mb-1 block text-left text-sm font-medium text-slate-700 ${isHero ? "sr-only" : ""}`}
        >
          {EN_MESSAGES.check.urlFieldLabel}
        </label>
        {helperText ? (
          <p className={`text-left leading-relaxed text-slate-500 ${isHero ? "mb-2 text-xs sm:text-[13px]" : "mb-1.5 text-xs sm:text-[13px]"}`}>
            {helperText}
          </p>
        ) : null}
        <input
          id="fraudly-url-input"
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!disabled && !loading) onSubmit();
            }
          }}
          placeholder={EN_MESSAGES.check.urlPlaceholder}
          aria-label={isHero ? EN_MESSAGES.check.urlFieldLabel : undefined}
          className={
            isHero
              ? "fraudly-focus h-14 w-full rounded-2xl border border-slate-300/85 bg-white px-5 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] placeholder:text-slate-400 hover:border-slate-400/75 focus:border-blue-500/75 sm:h-16 sm:text-lg"
              : "fraudly-search-field"
          }
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className={
          isHero
            ? "fraudly-motion fraudly-focus group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 text-base font-semibold text-white shadow-[0_18px_34px_-20px_rgb(79_70_229_/_0.7),0_10px_20px_-18px_rgb(37_99_235_/_0.55)] hover:scale-[1.01] hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-45 sm:h-16 sm:min-w-[12rem]"
            : "btn-primary-lg group"
        }
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
      <div className="fraudly-motion w-full rounded-3xl bg-gradient-to-br from-cyan-200/80 via-violet-200/70 to-blue-200/75 p-[1.5px] shadow-[0_32px_70px_-42px_rgb(79_70_229_/_0.62),0_24px_56px_-44px_rgb(14_165_233_/_0.44)] ring-1 ring-violet-100/65">
        <div className="rounded-[calc(1.5rem-1px)] bg-white/97 px-5 py-5 sm:px-6 sm:py-6">
          {shellInner}
        </div>
      </div>
    );
  }

  return <div className="fraudly-search-shell w-full">{shellInner}</div>;
}

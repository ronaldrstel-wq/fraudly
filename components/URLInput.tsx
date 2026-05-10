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
              ? "fraudly-focus h-[3.05rem] w-full rounded-2xl border border-slate-300/85 bg-white px-4 text-[15px] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] placeholder:text-slate-500 hover:border-slate-400/70 focus:border-blue-500/70 sm:h-[3.1rem] sm:text-base"
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
            ? "fraudly-motion fraudly-focus group inline-flex h-[3.05rem] shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 text-[15px] font-semibold text-white shadow-[0_12px_24px_-14px_rgb(79_70_229_/_0.58),0_8px_16px_-14px_rgb(37_99_235_/_0.45)] hover:-translate-y-[1px] hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-45 sm:h-[3.1rem] sm:min-w-[11rem]"
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
      <div className="fraudly-motion w-full rounded-3xl bg-gradient-to-br from-cyan-200/75 via-violet-200/65 to-blue-200/70 p-[1px] shadow-[0_20px_44px_-30px_rgb(79_70_229_/_0.38),0_10px_26px_-20px_rgb(14_165_233_/_0.28)] ring-1 ring-white/70">
        <div className="rounded-[calc(1.5rem-1px)] bg-white/95 px-3.5 py-3.5 sm:px-4 sm:py-4">
          {shellInner}
        </div>
      </div>
    );
  }

  return <div className="fraudly-search-shell w-full">{shellInner}</div>;
}

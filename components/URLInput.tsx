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
}

export function URLInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  helperText,
  primaryCtaLabel = "Check website",
  loadingLabel = "Checking website..."
}: URLInputProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:p-4">
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3.5">
        <div className="min-w-0 flex-1">
          <label htmlFor="fraudly-url-input" className="mb-1 block text-left text-sm font-medium text-slate-700">
            {EN_MESSAGES.check.urlFieldLabel}
          </label>
          {helperText ? (
            <p className="mb-1.5 text-left text-xs leading-relaxed text-slate-500 sm:text-[13px]">{helperText}</p>
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
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          className="h-12 w-full shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 text-base font-semibold text-white shadow-md shadow-blue-500/20 outline-none transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[10.5rem]"
        >
          {loading ? loadingLabel : primaryCtaLabel}
        </button>
      </div>
    </div>
  );
}

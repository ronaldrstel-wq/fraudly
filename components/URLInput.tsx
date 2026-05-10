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
    <div className="fraudly-search-shell w-full">
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
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
            className="fraudly-search-field"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          className="btn-primary-lg"
        >
          {loading ? loadingLabel : primaryCtaLabel}
        </button>
      </div>
    </div>
  );
}

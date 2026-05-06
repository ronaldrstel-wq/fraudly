"use client";

import { EN_MESSAGES } from "@/lib/messages.en";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function URLInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false
}: URLInputProps) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg shadow-slate-200/60 sm:p-4">
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="fraudly-url-input" className="mb-1 block text-left text-sm font-medium text-slate-700">
            {EN_MESSAGES.check.urlFieldLabel}
          </label>
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:h-12 sm:rounded-xl sm:px-4"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          className="h-11 w-full shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 outline-none transition hover:opacity-90 focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-auto sm:min-w-[10.5rem] sm:rounded-xl"
        >
          {loading ? "Checking website..." : "Check website"}
        </button>
      </div>
    </div>
  );
}

"use client";

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
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 md:p-5">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste a link here (e.g. https://example.com)"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          aria-label="URL to check"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          className="h-12 w-full shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[10.5rem]"
        >
          {loading ? "Analyzing link..." : "Check now ->"}
        </button>
      </div>
    </div>
  );
}

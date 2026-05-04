"use client";

import { useEffect, useId, useState } from "react";

export interface CookiePreferencesModalProps {
  open: boolean;
  initialAnalytics: boolean;
  initialMarketing: boolean;
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (prefs: { analytics: boolean; marketing: boolean }) => void;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="min-w-0">
        <p className="font-medium text-slate-900" id={`${id}-label`}>
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <label
        className={`relative inline-flex h-7 w-12 shrink-0 items-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-labelledby={`${id}-label`}
        />
        <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500" />
        <span
          className="pointer-events-none absolute left-0.5 top-0.5 z-10 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[22px]"
          aria-hidden
        />
      </label>
    </div>
  );
}

export function CookiePreferencesModal({
  open,
  initialAnalytics,
  initialMarketing,
  onClose,
  onAcceptAll,
  onRejectAll,
  onSave
}: CookiePreferencesModalProps) {
  const titleId = useId();
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [marketing, setMarketing] = useState(initialMarketing);

  useEffect(() => {
    if (open) {
      setAnalytics(initialAnalytics);
      setMarketing(initialMarketing);
    }
  }, [open, initialAnalytics, initialMarketing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Close cookie preferences"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[61] w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/15"
      >
        <h2 id={titleId} className="text-lg font-bold text-slate-900">
          Cookie preferences
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Necessary cookies are always on. Choose whether we may use optional analytics or marketing cookies.
        </p>

        <div className="mt-2">
          <ToggleRow
            id="necessary"
            label="Necessary"
            description="Required for security, preferences, and basic site functionality."
            checked
            onChange={() => {}}
            disabled
          />
          <ToggleRow
            id="analytics"
            label="Analytics"
            description="Helps us understand how the product is used (e.g. check completions). Off by default."
            checked={analytics}
            onChange={setAnalytics}
          />
          <ToggleRow
            id="marketing"
            label="Marketing"
            description="Used for measuring campaigns if we add them later. Off by default."
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onRejectAll}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Reject All
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={() => onSave({ analytics, marketing })}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

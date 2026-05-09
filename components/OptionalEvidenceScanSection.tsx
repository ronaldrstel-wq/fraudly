"use client";

import { useId, useMemo, useState } from "react";

const PLATFORMS = [
  { value: "", label: "Where did you see this? (optional)" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other / not sure" }
] as const;

export type OptionalEvidenceScanValues = {
  file: File | null;
  previewUrl: string | null;
  adText: string;
  sourcePlatform: string;
};

type Props = {
  values: OptionalEvidenceScanValues;
  onChange: (next: OptionalEvidenceScanValues) => void;
  disabled?: boolean;
};

export function OptionalEvidenceScanSection({ values, onChange, disabled }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const accept = useMemo(() => "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", []);

  function clearFile() {
    if (values.previewUrl) URL.revokeObjectURL(values.previewUrl);
    onChange({ ...values, file: null, previewUrl: null });
  }

  function onPickFile(f: File | null) {
    if (!f) {
      clearFile();
      return;
    }
    if (values.previewUrl) URL.revokeObjectURL(values.previewUrl);
    const url = URL.createObjectURL(f);
    onChange({ ...values, file: f, previewUrl: url });
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3 sm:p-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-slate-800 hover:text-slate-950 disabled:opacity-60"
        aria-expanded={open}
      >
        <span>Add screenshot or ad context</span>
        <span className="text-slate-500" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {!open ? (
        <p className="mt-1.5 text-xs text-slate-500">Optional. Your URL check works the same without this.</p>
      ) : null}

      {open ? (
        <div className="mt-3 space-y-3 border-t border-slate-200/80 pt-3">
          <p className="text-xs font-medium text-slate-700">Optional: add a screenshot or social ad</p>
          <p className="text-xs leading-relaxed text-slate-600">
            Only upload screenshots that you are comfortable sharing. Avoid uploading personal information, payment details,
            or private conversations.
          </p>

          <div>
            <label htmlFor={`${id}-file`} className="block text-xs font-medium text-slate-700">
              Image (JPG, PNG, or WEBP · max 4 MB)
            </label>
            <input
              id={`${id}-file`}
              name="evidence-image"
              type="file"
              accept={accept}
              disabled={disabled}
              className="mt-1 block w-full max-w-md text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {values.file ? (
              <p className="mt-1 text-xs text-slate-500">
                Selected: {values.file.name} ({Math.round(values.file.size / 1024)} KB)
              </p>
            ) : null}
          </div>

          {values.previewUrl ? (
            <div className="relative mx-auto max-h-48 w-full max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={values.previewUrl} alt="Screenshot preview" className="max-h-48 w-full object-contain" />
            </div>
          ) : null}

          {values.file ? (
            <button type="button" disabled={disabled} onClick={clearFile} className="text-xs font-semibold text-slate-600 underline hover:text-slate-900">
              Remove image
            </button>
          ) : null}

          <div>
            <label htmlFor={`${id}-ad`} className="block text-xs font-medium text-slate-700">
              Paste the ad text, caption, or message you saw (optional)
            </label>
            <textarea
              id={`${id}-ad`}
              name="evidence-ad-text"
              rows={3}
              disabled={disabled}
              value={values.adText}
              onChange={(e) => onChange({ ...values, adText: e.target.value })}
              className="mt-1 w-full max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Example: “90% off Nike shoes today only — link in bio”"
            />
          </div>

          <div>
            <label htmlFor={`${id}-plat`} className="block text-xs font-medium text-slate-700">
              Source (optional)
            </label>
            <select
              id={`${id}-plat`}
              name="evidence-platform"
              disabled={disabled}
              value={values.sourcePlatform}
              onChange={(e) => onChange({ ...values, sourcePlatform: e.target.value })}
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value || "unset"} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}

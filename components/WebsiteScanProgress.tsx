interface WebsiteScanProgressProps {
  /** 0–100 */
  progress: number;
  status: string;
  failed?: boolean;
  className?: string;
}

export function WebsiteScanProgress({ progress, status, failed = false, className = "" }: WebsiteScanProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="region"
      aria-label="Website scan status"
      className={`fraudly-motion mx-auto mt-4 w-full max-w-3xl rounded-2xl border p-4 text-left shadow-subtle sm:p-5 ${className} ${
        failed
          ? "border-rose-200 bg-rose-50/95"
          : "border-sky-100 bg-white shadow-sky-100/40"
      }`}
    >
      <p className={`text-sm font-medium ${failed ? "text-rose-800" : "text-slate-700"}`} id="website-scan-progress-label">
        {status}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/90">
          <div
            role="progressbar"
            aria-labelledby="website-scan-progress-label"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${clamped} percent. ${status}`}
            className={`h-full rounded-full transition-[width] duration-300 ease-out ${
              failed ? "bg-rose-400" : "bg-gradient-to-r from-blue-500 to-purple-600"
            }`}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className={`shrink-0 tabular-nums text-xs font-semibold ${failed ? "text-rose-700" : "text-slate-600"}`}>
          {clamped}%
        </span>
      </div>
    </div>
  );
}

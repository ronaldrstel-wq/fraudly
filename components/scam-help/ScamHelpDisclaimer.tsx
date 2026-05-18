import { SCAM_HELP_DISCLAIMER } from "@/lib/scam-help/countries";

export function ScamHelpDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 text-center text-xs leading-relaxed text-slate-600 sm:text-sm ${className}`}
      role="note"
    >
      {SCAM_HELP_DISCLAIMER}
    </p>
  );
}

"use client";

import type { BasicCheckResult } from "@/types/scam";

function verdictLabel(verdict: BasicCheckResult["verdict"]) {
  if (verdict === "safe") return { label: "Veilig", tone: "text-emerald-700 bg-emerald-100" };
  if (verdict === "suspicious") return { label: "Mogelijk verdacht", tone: "text-amber-700 bg-amber-100" };
  return { label: "Hoog risico", tone: "text-rose-700 bg-rose-100" };
}

export function BasicResultCard({ result }: { result: BasicCheckResult }) {
  const verdict = verdictLabel(result.verdict);
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      <p className="text-sm font-medium text-slate-500">Basisresultaat</p>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Domein</p>
          <p className="text-lg font-semibold text-slate-900 break-all">{result.domain}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${verdict.tone}`}>{verdict.label}</span>
      </div>
      <p className="mt-4 text-sm text-slate-600">Volledige uitleg en advies zijn beschikbaar na ontgrendelen.</p>
    </div>
  );
}

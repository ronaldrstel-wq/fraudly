"use client";

type PurchaseAction = "single_check" | "five_checks" | "twenty_checks" | "premium_monthly";

interface AnalysisPaywallProps {
  mode: "suspicious" | "limit";
  loading?: boolean;
  onBuy: (action: PurchaseAction) => void;
}

export function AnalysisPaywall({ mode, loading = false, onBuy }: AnalysisPaywallProps) {
  const isLimit = mode === "limit";
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-lg shadow-slate-200/60">
      <h3 className="text-xl font-bold text-slate-900">
        {isLimit ? "Je gratis checks zijn op" : "Zie precies waarom dit verdacht kan zijn"}
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        {isLimit
          ? "Blijf beschermd tegen verdachte advertenties, links en berichten."
          : "We hebben signalen gevonden die kunnen wijzen op fraude. Ontgrendel de volledige analyse voordat je actie onderneemt."}
      </p>

      {!isLimit && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Bekijk welke signalen zijn gevonden</li>
          <li>Zie de volledige risicoscore</li>
          <li>Krijg advies wat je nu het beste kunt doen</li>
        </ul>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => onBuy("single_check")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {isLimit ? "Koop 1 check" : "Ontgrendel voor €0,99"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onBuy("five_checks")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {isLimit ? "Koop bundel" : "Koop 5 checks voor €3,99"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onBuy("twenty_checks")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Koop 20 checks voor €9,99
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onBuy("premium_monthly")}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {isLimit ? "Start Premium" : "Start Premium voor €6,99/mnd"}
        </button>
      </div>
    </div>
  );
}

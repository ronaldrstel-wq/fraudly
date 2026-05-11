"use client";

import { useEffect, useState } from "react";

type OverrideVerdict = "trusted" | "suspicious" | "high_risk" | "none";

export function AdminToolsClient() {
  const [domain, setDomain] = useState("");
  const [limit, setLimit] = useState(100);
  const [overrideVerdict, setOverrideVerdict] = useState<OverrideVerdict>("none");
  const [overrideNote, setOverrideNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugJson, setDebugJson] = useState<string>("");
  const [latestDomains, setLatestDomains] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/tools", { credentials: "same-origin" });
      const json = (await res.json().catch(() => null)) as { latest?: Array<{ normalizedValue?: string }> } | null;
      if (!res.ok || !json?.latest) return;
      setLatestDomains(
        json.latest
          .map((row) => row.normalizedValue ?? "")
          .filter(Boolean)
          .slice(0, 12)
      );
    })();
  }, []);

  async function runAction(body: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body)
      });
      const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok) {
        setMessage(`Action failed: ${String(json?.error ?? res.status)}`);
        return;
      }
      setMessage(`Action "${String(body.action)}" completed.`);
      setDebugJson(JSON.stringify(json, null, 2));
    } finally {
      setLoading(false);
    }
  }

  async function loadDebug() {
    if (!domain.trim()) {
      setMessage("Enter a domain first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/tools?domain=${encodeURIComponent(domain)}`, {
        method: "GET",
        credentials: "same-origin"
      });
      const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok) {
        setMessage(`Debug fetch failed: ${String(json?.error ?? res.status)}`);
        return;
      }
      setMessage("Debug details loaded.");
      setDebugJson(JSON.stringify(json, null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Domain tools</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Domain
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Override verdict
            <select
              value={overrideVerdict}
              onChange={(e) => setOverrideVerdict(e.target.value as OverrideVerdict)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            >
              <option value="none">none</option>
              <option value="trusted">trusted</option>
              <option value="suspicious">suspicious</option>
              <option value="high_risk">high_risk</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Override note (optional)
          <textarea
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={loading}
            onClick={() => runAction({ action: "recalculate_domain", domain })}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
          >
            Recalculate domain
          </button>
          <button
            disabled={loading}
            onClick={() => runAction({ action: "force_refresh_reputation", domain })}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
          >
            Force refresh reputation
          </button>
          <button
            disabled={loading}
            onClick={() => runAction({ action: "clear_reputation_cache", domain })}
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Clear reputation cache
          </button>
          <button
            disabled={loading}
            onClick={() => runAction({ action: "hide_latest_check", domain })}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            Hide from latest checks
          </button>
          <button
            disabled={loading}
            onClick={() => runAction({ action: "set_override", domain, overrideVerdict, note: overrideNote })}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
          >
            Save override
          </button>
          <button
            disabled={loading}
            onClick={loadDebug}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
          >
            View debug details
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Recent recalculate</p>
        <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Limit
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number.parseInt(e.target.value || "100", 10))}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 sm:max-w-[160px]"
          />
        </label>
        <button
          disabled={loading}
          onClick={() => runAction({ action: "recalculate_recent", limit })}
          className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
        >
          Recalculate/rerank recent scans
        </button>
        {latestDomains.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest scans</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {latestDomains.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDomain(item)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p>
      ) : null}
      {debugJson ? (
        <pre className="max-h-[560px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
          {debugJson}
        </pre>
      ) : null}
    </section>
  );
}

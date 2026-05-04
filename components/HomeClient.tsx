"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnalysisPaywall } from "@/components/AnalysisPaywall";
import { BasicResultCard } from "@/components/BasicResultCard";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { trackCheckCompleted, trackCheckFailed, trackCheckStarted } from "@/lib/analytics";
import { GENERIC_CHECK_ERROR, INVALID_URL_MESSAGE } from "@/lib/messages";
import { isCheckApiResponse, type BasicCheckResult, type CheckApiResponse, type ScamCheckResult } from "@/types/scam";

const ResultCard = dynamic(() => import("@/components/ResultCard").then((m) => ({ default: m.ResultCard })), {
  loading: () => <div className="min-h-[280px] w-full animate-pulse rounded-xl bg-slate-100" aria-hidden />
});

const FeatureCards = dynamic(() => import("@/components/FeatureCards").then((m) => ({ default: m.FeatureCards })), {
  loading: () => <div className="h-44 w-full animate-pulse rounded-xl bg-slate-100 md:h-36" aria-hidden />
});

const PostScanAppPromo = dynamic(() => import("@/components/PostScanAppPromo").then((m) => ({ default: m.PostScanAppPromo })), {
  loading: () => <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" aria-hidden />
});

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function HomeClient() {
  const [userId, setUserId] = useState<string>("guest");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [basicResult, setBasicResult] = useState<BasicCheckResult | null>(null);
  const [apiState, setApiState] = useState<CheckApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullLocked, setFullLocked] = useState(false);
  const inFlight = useRef(false);

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

  useEffect(() => {
    const key = "fraudly-user-id";
    const existing = window.localStorage.getItem(key);
    if (existing) {
      setUserId(existing);
      return;
    }
    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `anon-${Date.now()}`;
    window.localStorage.setItem(key, generated);
    setUserId(generated);
  }, []);

  async function runCheck(detailLevel: "basic" | "full") {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setFullLocked(false);
      setError("Please enter a URL to check.");
      return;
    }

    if (!isValidUrl(trimmed)) {
      setFullLocked(false);
      setError(INVALID_URL_MESSAGE);
      trackCheckFailed("invalid_url_client");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    setFullLocked(false);

    try {
      trackCheckStarted();
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fraudly-user-id": userId },
        body: JSON.stringify({ url: trimmed, detailLevel })
      });

      if (response.status === 402) {
        setResult(null);
        setFullLocked(true);
        trackCheckFailed("rate_limit");
        return;
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        setResult(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed("json_parse");
        return;
      }

      if (!response.ok) {
        setResult(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed(`http_${response.status}`);
        return;
      }

      if (!isCheckApiResponse(payload)) {
        setResult(null);
        setBasicResult(null);
        setApiState(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed("invalid_response_shape");
        return;
      }

      setApiState(payload);
      setFullLocked(false);
      if (payload.detailLevel === "full") {
        setResult(payload.result as ScamCheckResult);
        setBasicResult(null);
      } else {
        setResult(null);
        setBasicResult(payload.result as BasicCheckResult);
      }
      trackCheckCompleted(payload.result.score);
    } catch {
      setResult(null);
      setBasicResult(null);
      setFullLocked(false);
      setError(GENERIC_CHECK_ERROR);
      trackCheckFailed("network");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function handleCheck() {
    runCheck("basic");
  }

  async function handleCheckout(action: "single_check" | "five_checks" | "twenty_checks" | "premium_monthly") {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fraudly-user-id": userId },
      body: JSON.stringify({ sku: action })
    });
    const payload = (await response.json()) as { checkoutUrl?: string };
    if (payload.checkoutUrl) window.location.href = payload.checkoutUrl;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:pt-14 md:pt-20">
        <Hero url={url} onUrlChange={setUrl} onSubmit={handleCheck} loading={loading} disabled={disabled} />

        {fullLocked && <div className="result-in mx-auto mt-6 max-w-3xl"><AnalysisPaywall mode="limit" onBuy={handleCheckout} /></div>}

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {basicResult && (
          <section className="result-in mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[1.7fr_1fr]">
            <div className="min-w-0">
              <BasicResultCard result={basicResult} />
            </div>
            <div className="min-w-0 lg:pt-0">
              <AnalysisPaywall
                mode={basicResult.verdict === "safe" ? "limit" : "suspicious"}
                onBuy={handleCheckout}
              />
              <button
                type="button"
                onClick={() => runCheck("full")}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Gebruik beschikbare credit / premium
              </button>
            </div>
          </section>
        )}

        {result && (
          <>
            <section className="result-in mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[1.7fr_1fr]">
              <div className="min-w-0">
                <ResultCard result={result} />
              </div>
              <div className="min-w-0 lg:pt-0">
                <FeatureCards stacked />
              </div>
            </section>
            <div className="result-in mx-auto mt-6 max-w-3xl">
              <PostScanAppPromo />
            </div>
            {apiState?.upsellPremium && (
              <div className="result-in mx-auto mt-6 max-w-3xl rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                Je hebt al meerdere checks gedaan. Met Premium check je goedkoper en zonder gedoe.
                <a href="/pricing" className="ml-2 font-semibold underline">
                  Bekijk Premium
                </a>
              </div>
            )}
          </>
        )}

        {!result && !basicResult && !fullLocked && (
          <section className="mt-8 sm:mt-10">
            <FeatureCards />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

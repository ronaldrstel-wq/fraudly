"use client";

import { useMemo, useRef, useState } from "react";
import { FeatureCards } from "@/components/FeatureCards";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { PostScanAppPromo } from "@/components/PostScanAppPromo";
import { RateLimitCTA } from "@/components/RateLimitCTA";
import { ResultCard } from "@/components/ResultCard";
import { SiteFooter } from "@/components/SiteFooter";
import { trackCheckCompleted, trackCheckFailed, trackCheckStarted } from "@/lib/analytics";
import { GENERIC_CHECK_ERROR, INVALID_URL_MESSAGE } from "@/lib/messages";
import { isScamCheckResult, type ScamCheckResult } from "@/types/scam";

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const inFlight = useRef(false);

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

  async function handleCheck() {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setRateLimited(false);
      setError("Please enter a URL to check.");
      return;
    }

    if (!isValidUrl(trimmed)) {
      setRateLimited(false);
      setError(INVALID_URL_MESSAGE);
      trackCheckFailed("invalid_url_client");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    setRateLimited(false);

    try {
      trackCheckStarted();
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed })
      });

      if (response.status === 429) {
        setResult(null);
        setRateLimited(true);
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

      if (!isScamCheckResult(payload)) {
        setResult(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed("invalid_response_shape");
        return;
      }

      setRateLimited(false);
      setResult(payload);
      trackCheckCompleted(payload.score);
    } catch {
      setResult(null);
      setRateLimited(false);
      setError(GENERIC_CHECK_ERROR);
      trackCheckFailed("network");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:pt-14 md:pt-20">
        <Hero url={url} onUrlChange={setUrl} onSubmit={handleCheck} loading={loading} disabled={disabled} />

        {rateLimited && (
          <div className="result-in mx-auto mt-6 max-w-3xl">
            <RateLimitCTA />
          </div>
        )}

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
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
          </>
        )}

        {!result && !rateLimited && (
          <section className="mt-8 sm:mt-10">
            <FeatureCards />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

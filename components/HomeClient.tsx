"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import {
  trackAnonymousCheckCompleted,
  trackAnonymousCheckStarted,
  trackCheckFailed,
  trackEvent
} from "@/lib/analytics";
import { parseFlexibleWebsiteInput } from "@/lib/check-input/normalizeWebsiteInput";
import { EN_MESSAGES } from "@/lib/messages.en";
import { GENERIC_CHECK_ERROR } from "@/lib/messages";
import { isCheckApiResponse, type ScamCheckResult, type ScanProgressState } from "@/types/scam";

const ResultCard = dynamic(() => import("@/components/ResultCard").then((m) => ({ default: m.ResultCard })), {
  loading: () => <div className="min-h-[280px] w-full animate-pulse rounded-xl bg-slate-100" aria-hidden />
});

const FeatureCards = dynamic(() => import("@/components/FeatureCards").then((m) => ({ default: m.FeatureCards })), {
  loading: () => <div className="h-44 w-full animate-pulse rounded-xl bg-slate-100 md:h-36" aria-hidden />
});

const PostScanAppPromo = dynamic(() => import("@/components/PostScanAppPromo").then((m) => ({ default: m.PostScanAppPromo })), {
  loading: () => <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" aria-hidden />
});

export function HomeClient({ children }: { children?: ReactNode }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgressState | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const inFlight = useRef(false);

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

  async function runCheck() {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setError(EN_MESSAGES.check.missingUrl);
      return;
    }

    const parsedInput = parseFlexibleWebsiteInput(trimmed);
    if (!parsedInput.ok) {
      setError(EN_MESSAGES.check.invalidWebsiteInput);
      trackCheckFailed("invalid_url_client");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    setShowSignupPrompt(false);

    try {
      trackAnonymousCheckStarted();
      const response = await fetch("/api/check", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsedInput.canonicalHref,
          detailLevel: "full",
          language: "en",
          streamProgress: true
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let payload: Record<string, unknown> | null = null;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          const lines = text.split("\n");
          text = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let parsedLine: unknown;
            try {
              parsedLine = JSON.parse(line) as Record<string, unknown>;
            } catch {
              continue;
            }
            const event = parsedLine as { type?: string; progress?: ScanProgressState; payload?: Record<string, unknown> };
            if (event.type === "progress" && event.progress) {
              setScanProgress(event.progress);
            } else if (event.type === "result" && event.payload) {
              payload = event.payload;
            } else if (event.type === "error" && event.payload) {
              payload = event.payload;
            }
          }
        }
      }

      if (!response.ok && response.status === 401) {
        setResult(null);
        const msg =
          typeof payload?.message === "string"
            ? payload.message
            : EN_MESSAGES.auth.loginForUrlCheck;
        setError(msg);
        setShowSignupPrompt(true);
        trackEvent("signup_prompt_shown", { source: "api_401" });
        trackCheckFailed("unauthorized");
        return;
      }

      if (!response.ok && response.status === 402) {
        setResult(null);
        setShowSignupPrompt(true);
        setError(EN_MESSAGES.auth.loginForAnotherCheck);
        trackEvent("signup_prompt_shown", { source: "api_402" });
        trackCheckFailed("rate_limit");
        return;
      }

      if (!response.ok) {
        setResult(null);
        const msgFromApi = typeof payload?.message === "string" ? payload.message : null;
        const requestId = typeof payload?.requestId === "string" ? payload.requestId : null;

        // If the backend returns non-JSON (e.g. Next error page), payload will be null.
        const bodySnippet = "";

        if (process.env.NODE_ENV !== "production") {
          console.error("[/api/check] non-ok", {
            status: response.status,
            requestId,
            msgFromApi,
            bodySnippet
          });
        }

        if (msgFromApi) {
          setError(msgFromApi);
        } else if (requestId) {
          setError(`${GENERIC_CHECK_ERROR} Reference: ${requestId}`);
        } else {
          setError(
            process.env.NODE_ENV === "production"
              ? GENERIC_CHECK_ERROR
              : `Request failed (HTTP ${response.status}). ${bodySnippet ? `Body: ${bodySnippet}` : ""}`
          );
        }

        trackCheckFailed(`http_${response.status}`);
        return;
      }

      if (!payload || !isCheckApiResponse(payload)) {
        setResult(null);
        setError(
          process.env.NODE_ENV === "production"
            ? GENERIC_CHECK_ERROR
            : `Unexpected API response (HTTP ${response.status}).`
        );
        trackCheckFailed("invalid_response_shape");
        return;
      }

      setResult(payload.result as ScamCheckResult);
      trackAnonymousCheckCompleted(payload.result.score);
    } catch (err) {
      setResult(null);
      const message = err instanceof Error ? err.message : "Unknown error";
      if (process.env.NODE_ENV !== "production") {
        console.error("[/api/check] fetch failed", { message });
      }
      setError(process.env.NODE_ENV === "production" ? GENERIC_CHECK_ERROR : `Network error: ${message}`);
      trackCheckFailed("network");
    } finally {
      inFlight.current = false;
      setLoading(false);
      setScanProgress((prev) => (prev && prev.percentage < 100 ? { ...prev, percentage: 100, currentStage: "Completed", activeStages: [] } : prev));
    }
  }

  function handleCheck() {
    runCheck();
  }

  const signupPrompt =
    showSignupPrompt ? (
      <div className="mx-auto mt-8 w-full max-w-[860px] rounded-[18px] border border-sky-100 bg-white p-[18px] shadow-md shadow-slate-200/40 md:p-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{EN_MESSAGES.freemium.promptTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{EN_MESSAGES.freemium.promptBody}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
            onClick={() => trackEvent("signup_started", { source: "signup_prompt" })}
          >
            {EN_MESSAGES.freemium.createFreeAccount}
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
            onClick={() => trackEvent("login_started", { source: "signup_prompt" })}
          >
            {EN_MESSAGES.auth.loginCta}
          </Link>
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-7 sm:pt-9 md:pt-12">
        <Hero
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleCheck}
          loading={loading}
          disabled={disabled}
          scanProgress={scanProgress}
        />

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
            {error.includes("Log in") ? (
              <div className="mt-3 flex justify-center">
                <Link
                  href="/sign-in"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {EN_MESSAGES.auth.loginCta}
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {signupPrompt}

        {result && (
          <>
            <section className="result-in mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[1.7fr_1fr]">
              <div className="min-w-0 space-y-3">
                <ResultCard result={result} />
                <p className="text-center text-sm text-slate-600 md:text-left">
                  Share or revisit this snapshot:{" "}
                  <Link
                    href={`/check/${encodeURIComponent(result.domain)}`}
                    className="font-semibold text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:decoration-blue-600"
                  >
                    /check/{result.domain}
                  </Link>
                </p>
              </div>
              <div className="min-w-0 lg:pt-0">
                <FeatureCards stacked />
              </div>
            </section>
            <div className="result-in mx-auto mt-6 max-w-3xl">
              <PostScanAppPromo />
            </div>
            <div className="result-in mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {EN_MESSAGES.freemium.afterResultBanner}
            </div>
          </>
        )}

        {!result && (
          <section className="mt-6 [content-visibility:auto] [contain-intrinsic-size:1px_220px] sm:mt-8">
            <FeatureCards />
          </section>
        )}
        <div className="[content-visibility:auto] [contain-intrinsic-size:1px_2200px]">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

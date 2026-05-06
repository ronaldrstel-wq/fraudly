"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { hasUsedAnonymousFreeCheck, markAnonymousFreeCheckUsed } from "@/lib/accessControl";
import {
  trackAnonymousCheckCompleted,
  trackAnonymousCheckStarted,
  trackCheckFailed,
  trackEvent,
  trackRegisteredCheckCompleted,
  trackRegisteredCheckStarted
} from "@/lib/analytics";
import { parseFlexibleWebsiteInput } from "@/lib/check-input/normalizeWebsiteInput";
import { EN_MESSAGES } from "@/lib/messages.en";
import { GENERIC_CHECK_ERROR } from "@/lib/messages";
import { isCheckApiResponse, type ScamCheckResult } from "@/types/scam";

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
  const { isSignedIn } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUsedFreeCheck, setHasUsedFreeCheck] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const inFlight = useRef(false);

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

  useEffect(() => {
    setHasUsedFreeCheck(hasUsedAnonymousFreeCheck());
  }, []);

  async function runCheck() {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setError(EN_MESSAGES.check.missingUrl);
      return;
    }

    if (!isSignedIn && hasUsedFreeCheck) {
      setShowSignupPrompt(true);
      setError(null);
      trackEvent("second_check_attempted", { url: trimmed });
      trackEvent("signup_prompt_shown", { source: "checker" });
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
      if (isSignedIn) {
        trackRegisteredCheckStarted();
      } else {
        trackAnonymousCheckStarted();
      }
      const response = await fetch("/api/check", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsedInput.canonicalHref,
          detailLevel: "full",
          language: "en"
        })
      });

      let payload: Record<string, unknown> | null = null;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }

      if (response.status === 401) {
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

      if (response.status === 402) {
        setResult(null);
        setShowSignupPrompt(true);
        setError(EN_MESSAGES.auth.loginForAnotherCheck);
        trackEvent("signup_prompt_shown", { source: "api_402" });
        trackCheckFailed("rate_limit");
        return;
      }

      if (!response.ok) {
        setResult(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed(`http_${response.status}`);
        return;
      }

      if (!payload || !isCheckApiResponse(payload)) {
        setResult(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed("invalid_response_shape");
        return;
      }

      setResult(payload.result as ScamCheckResult);
      if (!isSignedIn) {
        setHasUsedFreeCheck(true);
        markAnonymousFreeCheckUsed();
      }
      if (isSignedIn) {
        trackRegisteredCheckCompleted(payload.result.score);
      } else {
        trackAnonymousCheckCompleted(payload.result.score);
      }
    } catch {
      setResult(null);
      setError(GENERIC_CHECK_ERROR);
      trackCheckFailed("network");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function handleCheck() {
    runCheck();
  }

  const signInModalButton = (
    <SignInButton mode="modal">
      <button
        type="button"
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {EN_MESSAGES.auth.loginCta}
      </button>
    </SignInButton>
  );
  const signUpModalButton = (
    <SignUpButton mode="modal">
      <button
        type="button"
        className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        onClick={() => trackEvent("signup_started", { source: "signup_prompt" })}
      >
        {EN_MESSAGES.freemium.createFreeAccount}
      </button>
    </SignUpButton>
  );

  const signupPrompt =
    showSignupPrompt && !isSignedIn ? (
      <div className="mx-auto mt-8 w-full max-w-[860px] rounded-[18px] border border-sky-100 bg-white p-[18px] shadow-md shadow-slate-200/40 md:p-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{EN_MESSAGES.freemium.promptTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{EN_MESSAGES.freemium.promptBody}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {signUpModalButton}
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              onClick={() => trackEvent("login_started", { source: "signup_prompt" })}
            >
              {EN_MESSAGES.auth.loginCta}
            </button>
          </SignInButton>
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
        />

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
            {error.includes("Log in") ? (
              <div className="mt-3 flex justify-center">{signInModalButton}</div>
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
            {!isSignedIn && (
              <div className="result-in mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {EN_MESSAGES.freemium.afterResultBanner}
              </div>
            )}
          </>
        )}

        {!result && (
          <section className="mt-8 sm:mt-10">
            <FeatureCards />
          </section>
        )}
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

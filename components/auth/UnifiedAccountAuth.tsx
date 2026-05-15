"use client";

import { SignIn } from "@clerk/nextjs";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AuthAccountShell } from "@/components/auth/AuthAccountShell";
import { fraudlyClerkAppearance } from "@/components/auth/clerkAppearance";
import { SITE_URL } from "@/lib/seo";
import { readClerkPublishableKey } from "@/lib/clerkPublishableKey";
import { ClerkAuthCardSkeleton } from "@/components/auth/ClerkAuthCardSkeleton";
import { ClerkPublishableKeyMissing } from "@/components/auth/ClerkPublishableKeyMissing";

const DEFAULT_REDIRECT = SITE_URL;

/**
 * Single Clerk surface: OAuth (Apple/Google) signs in existing users or creates new ones.
 * Uses SignIn with transferable sign-up — no separate “Create account” path for social auth.
 */
function UnifiedAccountAuthInner() {
  const searchParams = useSearchParams();
  const redirectComplete = useMemo(() => {
    const raw = searchParams.get("redirect_url");
    if (!raw) return DEFAULT_REDIRECT;
    try {
      const url = new URL(raw, SITE_URL);
      if (url.origin === new URL(SITE_URL).origin) return url.pathname + url.search + url.hash;
    } catch {
      /* ignore */
    }
    return DEFAULT_REDIRECT;
  }, [searchParams]);

  return (
    <AuthAccountShell>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-in"
        transferable
        fallbackRedirectUrl={redirectComplete}
        signUpFallbackRedirectUrl={redirectComplete}
        appearance={fraudlyClerkAppearance}
        fallback={<ClerkAuthCardSkeleton title="Continue" />}
      />
      <p className="mt-4 text-center text-xs text-slate-500">
        New here? Apple and Google create one Fraudly account automatically — the same identity works on the website and
        mobile apps when you use the same provider.
      </p>
    </AuthAccountShell>
  );
}

export function UnifiedAccountAuth() {
  const pk = readClerkPublishableKey();
  if (!pk) {
    return <ClerkPublishableKeyMissing flow="sign-in" />;
  }

  return (
    <Suspense fallback={<ClerkAuthCardSkeleton title="Continue" />}>
      <UnifiedAccountAuthInner />
    </Suspense>
  );
}

"use client";

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { SITE_URL } from "@/lib/seo";
import { readClerkPublishableKey } from "@/lib/clerkPublishableKey";
import { ClerkAuthCardSkeleton } from "@/components/auth/ClerkAuthCardSkeleton";
import { ClerkPublishableKeyMissing } from "@/components/auth/ClerkPublishableKeyMissing";

const FALLBACK = SITE_URL;

// Post-sign-up / “sign in” link fallbacks: `fallbackRedirectUrl` + `signInFallbackRedirectUrl` on `<SignUp />` (→ https://fraudly.app).
// Client + `Suspense` so the route never stays visually empty while Clerk mounts.
export function EmbeddedSignUp() {
  const pk = readClerkPublishableKey();
  if (!pk) {
    return <ClerkPublishableKeyMissing flow="sign-up" />;
  }

  return (
    <Suspense fallback={<ClerkAuthCardSkeleton title="Create account" />}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={FALLBACK}
        signInFallbackRedirectUrl={FALLBACK}
        fallback={<ClerkAuthCardSkeleton title="Create account" />}
      />
    </Suspense>
  );
}

"use client";

import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { SITE_URL } from "@/lib/seo";
import { readClerkPublishableKey } from "@/lib/clerkPublishableKey";
import { ClerkAuthCardSkeleton } from "@/components/auth/ClerkAuthCardSkeleton";
import { ClerkPublishableKeyMissing } from "@/components/auth/ClerkPublishableKeyMissing";

const FALLBACK = SITE_URL;

// Post-auth fallbacks: Clerk uses `fallbackRedirectUrl` / `signUpFallbackRedirectUrl` on `<SignIn />` (→ https://fraudly.app).
// `<SignIn />` must live in a Client Component inside `Suspense` (Clerk uses `useSearchParams` internally).
export function EmbeddedSignIn() {
  const pk = readClerkPublishableKey();
  if (!pk) {
    return <ClerkPublishableKeyMissing flow="sign-in" />;
  }

  return (
    <Suspense fallback={<ClerkAuthCardSkeleton title="Sign in" />}>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={FALLBACK}
        signUpFallbackRedirectUrl={FALLBACK}
        fallback={<ClerkAuthCardSkeleton title="Sign in" />}
      />
    </Suspense>
  );
}

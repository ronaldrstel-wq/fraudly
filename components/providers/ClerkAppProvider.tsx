"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { fraudlyClerkLocalization } from "@/lib/clerkLocalization";
import { readClerkPublishableKey } from "@/lib/clerkPublishableKey";

const publishableKey = readClerkPublishableKey();

/**
 * Root Clerk context for the whole app (not only `/sign-in` / `/sign-up`).
 * Without this, Clerk client hooks and `UserButton` are inert outside the auth route group.
 *
 * When `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing, we still render children so marketing pages
 * work; `/sign-in` and `/sign-up` use `EmbeddedSignIn` / `EmbeddedSignUp` to show a clear message instead of a blank UI.
 */
export function ClerkAppProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return <>{children}</>;
  }
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
      localization={fraudlyClerkLocalization}
    >
      {children}
    </ClerkProvider>
  );
}

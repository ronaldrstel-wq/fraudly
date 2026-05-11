"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

/**
 * Root Clerk context for the whole app (not only `/sign-in` / `/sign-up`).
 * Without this, Clerk client hooks and `UserButton` are inert outside the auth route group.
 */
export function ClerkAppProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return children;
  }
  return (
    <ClerkProvider publishableKey={publishableKey} signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  );
}

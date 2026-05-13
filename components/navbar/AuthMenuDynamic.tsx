"use client";

import dynamic from "next/dynamic";
import { SignedOutAuthNavLinks } from "@/components/auth/SignedOutAuthNavLinks";

const AuthMenuLazy = dynamic(() => import("@/components/auth/AuthMenu").then((m) => ({ default: m.AuthMenu })), {
  loading: () => (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2 md:gap-3">
      <SignedOutAuthNavLinks />
    </div>
  ),
  ssr: false
});

/** Lazy Clerk UI for navbars — keeps Clerk out of the main homepage RSC payload. */
export function AuthMenuDynamic() {
  return <AuthMenuLazy />;
}

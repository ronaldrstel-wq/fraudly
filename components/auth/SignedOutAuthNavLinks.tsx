"use client";

import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

/** Stable CTAs when Clerk is still loading or unavailable — keeps navbar usable. */
export function SignedOutAuthNavLinks() {
  return (
    <>
      <Link href="/sign-in" className="fraudly-motion btn-secondary px-3 sm:px-4">
        {EN_MESSAGES.auth.loginCta}
      </Link>
      <Link href="/sign-up" className="fraudly-motion btn-primary px-3 sm:px-4">
        {EN_MESSAGES.auth.signUpCta}
      </Link>
    </>
  );
}

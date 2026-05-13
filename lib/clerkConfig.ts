/**
 * Clerk environment sanity checks (server-side).
 * The hostname in Clerk script URLs (e.g. `*.clerk.accounts.dev`) comes from the
 * publishable key’s instance — not from app source code.
 */

import { readClerkPublishableKey } from "@/lib/clerkPublishableKey";

const PK_TEST = "pk_test_";
const PK_LIVE = "pk_live_";

/** Log once per server process if production looks mis-keyed (visible in Vercel logs). */
export function logClerkProductionMisconfigWarnings(): void {
  if (process.env.NODE_ENV !== "production") return;
  // `next build` sets NODE_ENV=production but Clerk env is often unset locally — skip noisy checks during build.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const pk = readClerkPublishableKey();
  const sk = process.env.CLERK_SECRET_KEY?.trim();

  if (!pk) {
    console.error(
      "[Fraudly][Clerk] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing in production. Auth and Clerk JS will fail."
    );
    return;
  }

  if (pk.startsWith(PK_TEST)) {
    console.error(
      "[Fraudly][Clerk] Production is using a development publishable key (pk_test_*). " +
        "Use the Production instance publishable key (pk_live_*) in Vercel Production, " +
        "and add https://fraudly.app under Clerk → Domains → allowed origins / production URLs."
    );
  }

  if (!sk) {
    console.error("[Fraudly][Clerk] CLERK_SECRET_KEY is missing in production. Server-side auth will fail.");
  } else if (sk.startsWith("sk_test_") && pk.startsWith(PK_LIVE)) {
    console.error(
      "[Fraudly][Clerk] Mismatch: publishable key looks live (pk_live_*) but secret is sk_test_*. Use sk_live_* from the same Clerk Production application."
    );
  } else if (sk.startsWith("sk_live_") && pk.startsWith(PK_TEST)) {
    console.error(
      "[Fraudly][Clerk] Mismatch: secret is sk_live_* but publishable key is pk_test_*. Keys must come from the same Clerk environment (both Production or both Development)."
    );
  }
}

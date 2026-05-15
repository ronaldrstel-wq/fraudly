import type { EntitlementPatch } from "@/lib/entitlement/types";

/** Stripe Checkout / subscription fulfillment — the only website path that sets `stripe` entitlement. */
export function stripePremiumEntitlementPatch(subscriptionId?: string | null): EntitlementPatch {
  return {
    entitlementActive: true,
    entitlementSource: "stripe",
    entitlementProductId: subscriptionId ?? "premium_monthly",
    entitlementExpiresAt: null
  };
}

export function stripeRevokeEntitlementPatch(): EntitlementPatch {
  return {
    entitlementActive: false,
    entitlementSource: "none",
    entitlementProductId: null,
    entitlementExpiresAt: null
  };
}

import type { EntitlementSource, SubscriptionStatus, User, UserPlan } from "@prisma/client";
import type { EntitlementPatch } from "@/lib/entitlement/types";

/**
 * Keeps entitlement fields aligned with legacy Stripe plan columns until all writers use entitlement APIs.
 */
export function entitlementPatchFromLegacyBilling(
  user: Pick<User, "plan" | "subscriptionStatus" | "entitlementSource" | "entitlementActive">
): EntitlementPatch | null {
  const stripeActive = user.plan === "premium" && user.subscriptionStatus === "active";

  if (stripeActive) {
    return {
      entitlementActive: true,
      entitlementSource: "stripe",
      entitlementProductId: user.entitlementSource === "stripe" ? undefined : null
    };
  }

  if (user.entitlementSource === "stripe" && user.entitlementActive) {
    return {
      entitlementActive: false,
      entitlementSource: "none",
      entitlementProductId: null,
      entitlementExpiresAt: null
    };
  }

  return null;
}

export function legacyBillingFromStripeEntitlement(patch: EntitlementPatch): {
  plan?: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
} {
  if (patch.entitlementSource === "stripe" && patch.entitlementActive) {
    return { plan: "premium", subscriptionStatus: "active" };
  }
  if (patch.entitlementSource === "none" || !patch.entitlementActive) {
    return { plan: "free", subscriptionStatus: "inactive" };
  }
  return {};
}

import type { User, UserPlan, SubscriptionStatus } from "@prisma/client";
import type { BillingSnapshot } from "@/types/scam";
import { hasActiveVerifiedEntitlement } from "@/lib/entitlement/resolve";

export type BillingUser = User;
export type { UserPlan, SubscriptionStatus };

export type CheckoutSku = "single_check" | "five_checks" | "twenty_checks" | "premium_monthly";

export const FREE_CHECK_LIMIT = 5;
export const PREMIUM_MONTHLY_LIMIT = 200;

export function toBillingSnapshot(user: User): BillingSnapshot {
  return {
    plan: user.plan,
    freeChecksUsed: user.freeChecksUsed,
    credits: user.credits,
    monthlyChecksUsed: user.monthlyChecksUsed,
    paidChecksCount: user.paidChecksCount,
    subscriptionStatus: user.subscriptionStatus
  };
}

/** @deprecated Prefer `hasActiveVerifiedEntitlement` — kept for legacy Stripe plan columns. */
export function isPremiumActive(user: Pick<User, "plan" | "subscriptionStatus">): boolean {
  return user.plan === "premium" && user.subscriptionStatus === "active";
}

/**
 * Deep scan / elevated access: verified subscription entitlement OR one-time credits.
 * Never granted from Apple/Google login identity alone.
 */
export function hasPaidScanEntitlement(
  user: Pick<User, "plan" | "subscriptionStatus" | "credits" | "entitlementActive" | "entitlementSource" | "entitlementExpiresAt">
): boolean {
  return hasActiveVerifiedEntitlement(user) || user.credits > 0;
}

export function canRunBasicCheck(
  user: Pick<
    User,
    "freeChecksUsed" | "plan" | "subscriptionStatus" | "credits" | "entitlementActive" | "entitlementSource" | "entitlementExpiresAt"
  >
): boolean {
  return user.freeChecksUsed < FREE_CHECK_LIMIT || hasActiveVerifiedEntitlement(user) || user.credits > 0;
}

export function canViewFullAnalysis(
  user: Pick<
    User,
    "plan" | "subscriptionStatus" | "credits" | "monthlyChecksUsed" | "entitlementActive" | "entitlementSource" | "entitlementExpiresAt"
  >
): boolean {
  if (hasActiveVerifiedEntitlement(user)) return user.monthlyChecksUsed < PREMIUM_MONTHLY_LIMIT;
  return user.credits > 0;
}

export function canViewFullFromBillingSnapshot(snapshot: BillingSnapshot): boolean {
  return canViewFullAnalysis({
    plan: snapshot.plan,
    subscriptionStatus: snapshot.subscriptionStatus,
    credits: snapshot.credits,
    monthlyChecksUsed: snapshot.monthlyChecksUsed,
    entitlementActive: snapshot.plan === "premium" && snapshot.subscriptionStatus === "active",
    entitlementSource: snapshot.plan === "premium" && snapshot.subscriptionStatus === "active" ? "stripe" : "none",
    entitlementExpiresAt: null
  });
}

export function consumeFullAnalysisAccess(user: User): User {
  if (hasActiveVerifiedEntitlement(user)) {
    return { ...user, monthlyChecksUsed: user.monthlyChecksUsed + 1 };
  }
  if (user.credits > 0) {
    return { ...user, credits: user.credits - 1 };
  }
  throw new Error("No available access for full analysis");
}

/** @deprecated use consumeFullAnalysisAccess */
export const consumeFullAnalysisCredit = consumeFullAnalysisAccess;

export function shouldShowPremiumUpsell(user: Pick<User, "plan" | "paidChecksCount">): boolean {
  return user.plan !== "premium" && user.paidChecksCount >= 3;
}

/** Parse billing from API error payloads (e.g. 402). */
export function parseBillingSnapshot(value: unknown): BillingSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const b = value as Record<string, unknown>;
  if (b.plan !== "free" && b.plan !== "premium") return null;
  if (typeof b.freeChecksUsed !== "number" || Number.isNaN(b.freeChecksUsed)) return null;
  if (typeof b.credits !== "number" || Number.isNaN(b.credits)) return null;
  if (typeof b.monthlyChecksUsed !== "number" || Number.isNaN(b.monthlyChecksUsed)) return null;
  if (typeof b.paidChecksCount !== "number" || Number.isNaN(b.paidChecksCount)) return null;
  if (
    b.subscriptionStatus !== "active" &&
    b.subscriptionStatus !== "inactive" &&
    b.subscriptionStatus !== "canceled" &&
    b.subscriptionStatus !== "past_due"
  ) {
    return null;
  }
  return {
    plan: b.plan,
    freeChecksUsed: b.freeChecksUsed,
    credits: b.credits,
    monthlyChecksUsed: b.monthlyChecksUsed,
    paidChecksCount: b.paidChecksCount,
    subscriptionStatus: b.subscriptionStatus
  };
}

export function applyCheckoutCredits(user: User, sku: CheckoutSku): User {
  if (sku === "premium_monthly") {
    return {
      ...user,
      plan: "premium",
      subscriptionStatus: "active",
      monthlyChecksUsed: 0,
      entitlementActive: true,
      entitlementSource: "stripe",
      entitlementProductId: "premium_monthly",
      entitlementExpiresAt: null
    };
  }

  const amount = sku === "single_check" ? 1 : sku === "five_checks" ? 5 : 20;
  return {
    ...user,
    credits: user.credits + amount,
    paidChecksCount: user.paidChecksCount + amount
  };
}

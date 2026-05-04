export type UserPlan = "free" | "premium";
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "past_due";
export type CheckoutSku = "single_check" | "five_checks" | "twenty_checks" | "premium_monthly";

export interface BillingUser {
  id: string;
  plan: UserPlan;
  freeChecksUsed: number;
  credits: number;
  monthlyChecksUsed: number;
  paidChecksCount: number;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export const FREE_CHECK_LIMIT = 5;
export const PREMIUM_MONTHLY_LIMIT = 200;

export function isPremiumActive(user: BillingUser): boolean {
  return user.plan === "premium" && user.subscriptionStatus === "active";
}

export function canRunBasicCheck(user: BillingUser): boolean {
  return user.freeChecksUsed < FREE_CHECK_LIMIT || isPremiumActive(user) || user.credits > 0;
}

export function canViewFullAnalysis(user: BillingUser): boolean {
  if (isPremiumActive(user)) return user.monthlyChecksUsed < PREMIUM_MONTHLY_LIMIT;
  return user.credits > 0;
}

export function consumeFullAnalysisAccess(user: BillingUser): BillingUser {
  if (isPremiumActive(user)) {
    return { ...user, monthlyChecksUsed: user.monthlyChecksUsed + 1 };
  }
  if (user.credits > 0) {
    return { ...user, credits: user.credits - 1 };
  }
  throw new Error("No available access for full analysis");
}

/** @deprecated use consumeFullAnalysisAccess */
export const consumeFullAnalysisCredit = consumeFullAnalysisAccess;

export function shouldShowPremiumUpsell(user: BillingUser): boolean {
  return user.plan !== "premium" && user.paidChecksCount >= 3;
}

export function createDefaultUser(id: string): BillingUser {
  return {
    id,
    plan: "free",
    freeChecksUsed: 0,
    credits: 0,
    monthlyChecksUsed: 0,
    paidChecksCount: 0,
    subscriptionStatus: "inactive"
  };
}

export function applyCheckoutCredits(user: BillingUser, sku: CheckoutSku): BillingUser {
  if (sku === "premium_monthly") {
    return {
      ...user,
      plan: "premium",
      subscriptionStatus: "active",
      monthlyChecksUsed: 0
    };
  }

  const amount = sku === "single_check" ? 1 : sku === "five_checks" ? 5 : 20;
  return {
    ...user,
    credits: user.credits + amount,
    paidChecksCount: user.paidChecksCount + amount
  };
}

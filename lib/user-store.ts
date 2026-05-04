import type { BillingUser } from "@/lib/billing";
import { db } from "@/lib/db";

export async function getOrCreateUser(userId: string): Promise<BillingUser> {
  const user = await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });
  return user;
}

export async function saveUser(user: BillingUser): Promise<BillingUser> {
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      plan: user.plan,
      freeChecksUsed: user.freeChecksUsed,
      credits: user.credits,
      monthlyChecksUsed: user.monthlyChecksUsed,
      paidChecksCount: user.paidChecksCount,
      subscriptionStatus: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId ?? null
    }
  });
  return updated;
}

export function getUserIdFromRequest(request: Request): string {
  // TODO: Replace this fallback with your project auth (e.g. Clerk/NextAuth) and return authenticated user id.
  const fromHeader = request.headers.get("x-fraudly-user-id")?.trim();
  if (fromHeader) return fromHeader;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0]?.trim() ?? "unknown"}`;
  return "guest";
}

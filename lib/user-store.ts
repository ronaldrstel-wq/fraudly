import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { detectClientPlatform } from "@/lib/identity/detect-platform";
import { buildSafeAccessLogContext, logSafeAccessContext } from "@/lib/identity/log-access-context";
import { syncUserProfileFromClerk } from "@/lib/identity/sync-user-profile";

export class AuthRequiredError extends Error {
  override name = "AuthRequiredError";
}

export async function requireBillingUser(request?: Request): Promise<User> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthRequiredError();
  }
  return getOrCreateUserForClerk(userId, request);
}

/** Returns authenticated billing user, or null when signed out. */
export async function getBillingUserOrNull(request?: Request): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getOrCreateUserForClerk(userId, request);
}

async function getOrCreateUserForClerk(clerkUserId: string, request?: Request): Promise<User> {
  const platform = request ? detectClientPlatform(request) : "web";
  const clerk = await currentUser();
  const email =
    clerk?.primaryEmailAddress?.emailAddress ?? clerk?.emailAddresses?.[0]?.emailAddress ?? null;

  let user = await db.user.findUnique({
    where: { authProviderId: clerkUserId }
  });

  if (!user) {
    try {
      user = await db.user.create({
        data: {
          authProvider: "clerk",
          authProviderId: clerkUserId,
          email,
          plan: "free",
          credits: 0,
          freeChecksUsed: 0,
          monthlyChecksUsed: 0,
          paidChecksCount: 0,
          subscriptionStatus: "inactive",
          lastAuthSurface: "website",
          lastDetectedPlatform: platform
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        user = await db.user.findUnique({ where: { authProviderId: clerkUserId } });
        if (!user) {
          user = await db.user.create({
            data: {
              authProvider: "clerk",
              authProviderId: clerkUserId,
              email: null,
              plan: "free",
              credits: 0,
              freeChecksUsed: 0,
              monthlyChecksUsed: 0,
              paidChecksCount: 0,
              subscriptionStatus: "inactive",
              lastAuthSurface: "website",
              lastDetectedPlatform: platform
            }
          });
        }
      } else {
        throw error;
      }
    }
  }

  const synced = await syncUserProfileFromClerk({
    clerkUserId,
    authSurface: "website",
    platform,
    clerkUser: clerk
  });

  const resolved = synced ?? user;
  logSafeAccessContext("user-store", buildSafeAccessLogContext(resolved, platform));
  return resolved;
}

export async function saveUser(user: User): Promise<User> {
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
      stripeSubscriptionId: user.stripeSubscriptionId ?? null,
      email: user.email ?? null,
      identityProvider: user.identityProvider,
      lastAuthSurface: user.lastAuthSurface,
      entitlementActive: user.entitlementActive,
      entitlementSource: user.entitlementSource,
      entitlementProductId: user.entitlementProductId ?? null,
      entitlementExpiresAt: user.entitlementExpiresAt ?? null,
      lastDetectedPlatform: user.lastDetectedPlatform,
      revenueCatAppUserId: user.revenueCatAppUserId ?? null
    }
  });
  return updated;
}

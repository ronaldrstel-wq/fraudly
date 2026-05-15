import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

export class AuthRequiredError extends Error {
  override name = "AuthRequiredError";
}

export async function requireBillingUser(): Promise<User> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthRequiredError();
  }
  return getOrCreateUserForClerk(userId);
}

/** Returns authenticated billing user, or null when signed out. */
export async function getBillingUserOrNull(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getOrCreateUserForClerk(userId);
}

async function getOrCreateUserForClerk(clerkUserId: string): Promise<User> {
  const existing = await db.user.findUnique({
    where: { authProviderId: clerkUserId }
  });
  if (existing) {
    return existing;
  }

  const clerk = await currentUser();
  const email =
    clerk?.primaryEmailAddress?.emailAddress ?? clerk?.emailAddresses?.[0]?.emailAddress ?? null;

  try {
    return await db.user.create({
      data: {
        authProvider: "clerk",
        authProviderId: clerkUserId,
        email,
        plan: "free",
        credits: 0,
        freeChecksUsed: 0,
        monthlyChecksUsed: 0,
        paidChecksCount: 0,
        subscriptionStatus: "inactive"
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const race = await db.user.findUnique({
        where: { authProviderId: clerkUserId }
      });
      if (race) return race;
      return db.user.create({
        data: {
          authProvider: "clerk",
          authProviderId: clerkUserId,
          email: null,
          plan: "free",
          credits: 0,
          freeChecksUsed: 0,
          monthlyChecksUsed: 0,
          paidChecksCount: 0,
          subscriptionStatus: "inactive"
        }
      });
    }
    throw error;
  }
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
      email: user.email ?? null
    }
  });
  return updated;
}

import { clerkClient } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/backend";
import type { ClientPlatform, User } from "@prisma/client";
import { db } from "@/lib/db";
import { entitlementPatchFromLegacyBilling } from "@/lib/entitlement/sync-legacy-stripe";
import { resolveIdentityProviderFromClerkUser } from "@/lib/identity/resolve-clerk-identity";
import type { AuthSurface } from "@/lib/identity/types";

const CLERK_METADATA_KEYS = {
  identityProvider: "fraudly_identity_provider",
  lastAuthSurface: "fraudly_last_auth_surface"
} as const;

export type SyncUserProfileOptions = {
  clerkUserId: string;
  authSurface?: AuthSurface;
  platform?: ClientPlatform;
  clerkUser?: ClerkUser | null;
};

/**
 * Syncs website identity fields from Clerk into Postgres (and mirrors non-entitlement metadata to Clerk).
 * Does not grant App Store / Google Play entitlement from OAuth provider.
 */
export async function syncUserProfileFromClerk(opts: SyncUserProfileOptions): Promise<User | null> {
  const authSurface = opts.authSurface ?? "website";
  const platform = opts.platform ?? "web";

  let clerk: ClerkUser | null = opts.clerkUser ?? null;
  if (!clerk) {
    try {
      const client = await clerkClient();
      clerk = await client.users.getUser(opts.clerkUserId);
    } catch {
      console.warn("[identity] clerk user fetch failed", { clerkUserIdPresent: true });
      return null;
    }
  }

  const identityProvider = resolveIdentityProviderFromClerkUser(clerk);
  const email =
    clerk.primaryEmailAddress?.emailAddress ?? clerk.emailAddresses?.[0]?.emailAddress ?? null;

  const existing = await db.user.findUnique({ where: { authProviderId: opts.clerkUserId } });
  if (!existing) return null;

  const legacyEntitlement = entitlementPatchFromLegacyBilling(existing);

  const updated = await db.user.update({
    where: { id: existing.id },
    data: {
      identityProvider,
      lastAuthSurface: authSurface,
      lastDetectedPlatform: platform,
      email: email ?? existing.email,
      ...(legacyEntitlement ?? {})
    }
  });

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(opts.clerkUserId, {
      publicMetadata: {
        [CLERK_METADATA_KEYS.identityProvider]: identityProvider,
        [CLERK_METADATA_KEYS.lastAuthSurface]: authSurface
      }
    });
  } catch {
    // Non-blocking — Postgres remains source of truth for the website.
  }

  return updated;
}

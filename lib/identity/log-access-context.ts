import type { User } from "@prisma/client";
import type { ClientPlatform } from "@prisma/client";
import { hasActiveVerifiedEntitlement } from "@/lib/entitlement/resolve";

export type SafeAccessLogContext = {
  clerkUserIdPresent: boolean;
  authProvider: string;
  lastSurface: string;
  entitlementActive: boolean;
  entitlementSource: string;
  platform: ClientPlatform;
};

/** Safe, token-free debug logging for auth / entitlement checks. */
export function buildSafeAccessLogContext(
  user: Pick<
    User,
    | "authProviderId"
    | "identityProvider"
    | "lastAuthSurface"
    | "entitlementActive"
    | "entitlementSource"
    | "entitlementExpiresAt"
    | "lastDetectedPlatform"
  > | null,
  platform: ClientPlatform
): SafeAccessLogContext {
  return {
    clerkUserIdPresent: Boolean(user?.authProviderId),
    authProvider: user?.identityProvider ?? "unknown",
    lastSurface: user?.lastAuthSurface ?? "website",
    entitlementActive: user ? hasActiveVerifiedEntitlement(user) : false,
    entitlementSource: user?.entitlementSource ?? "none",
    platform: user?.lastDetectedPlatform ?? platform
  };
}

export function logSafeAccessContext(scope: string, ctx: SafeAccessLogContext): void {
  console.info(`[${scope}] access context`, ctx);
}

import type { EntitlementSource, User } from "@prisma/client";

type EntitlementFields = Pick<
  User,
  "entitlementActive" | "entitlementSource" | "entitlementExpiresAt"
>;

/**
 * Premium / deep-scan access from a verified purchase channel only.
 * Never derived from Apple/Google login identity.
 */
export function hasActiveVerifiedEntitlement(user: EntitlementFields): boolean {
  if (!user.entitlementActive) return false;
  if (user.entitlementSource === "none") return false;
  if (user.entitlementExpiresAt && user.entitlementExpiresAt.getTime() <= Date.now()) {
    return false;
  }
  return user.entitlementSource === "stripe" || user.entitlementSource === "app_store" || user.entitlementSource === "google_play";
}

export function isVerifiedEntitlementSource(source: EntitlementSource): boolean {
  return source === "stripe" || source === "app_store" || source === "google_play";
}

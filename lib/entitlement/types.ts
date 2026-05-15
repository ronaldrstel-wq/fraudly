import type { EntitlementSource } from "@prisma/client";

export type { EntitlementSource };

export const ENTITLEMENT_SOURCES = ["none", "stripe", "app_store", "google_play"] as const satisfies readonly EntitlementSource[];

export type EntitlementPatch = {
  entitlementActive: boolean;
  entitlementSource: EntitlementSource;
  entitlementProductId?: string | null;
  entitlementExpiresAt?: Date | null;
  revenueCatAppUserId?: string | null;
};

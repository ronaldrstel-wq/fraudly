import type { EntitlementSource } from "@prisma/client";
import { db } from "@/lib/db";
import type { EntitlementPatch } from "@/lib/entitlement/types";

export type RevenueCatStore = "app_store" | "play_store" | "stripe" | string;

export type RevenueCatEntitlementEvent = {
  appUserId: string;
  clerkUserId?: string | null;
  store: RevenueCatStore;
  productId?: string | null;
  expiresAt?: Date | null;
  isActive: boolean;
};

function storeToEntitlementSource(store: RevenueCatStore): EntitlementSource | null {
  const s = store.toLowerCase();
  if (s === "app_store" || s === "mac_app_store") return "app_store";
  if (s === "play_store" || s === "google_play") return "google_play";
  if (s === "stripe") return "stripe";
  return null;
}

/**
 * Applies verified RevenueCat entitlement to a user linked by Clerk id or RevenueCat app user id.
 * Never called from website OAuth — webhook / server-to-server only.
 */
export async function applyRevenueCatEntitlement(event: RevenueCatEntitlementEvent): Promise<boolean> {
  const source = storeToEntitlementSource(event.store);
  if (!source) return false;

  const patch: EntitlementPatch = event.isActive
    ? {
        entitlementActive: true,
        entitlementSource: source,
        entitlementProductId: event.productId ?? null,
        entitlementExpiresAt: event.expiresAt ?? null,
        revenueCatAppUserId: event.appUserId
      }
    : {
        entitlementActive: false,
        entitlementSource: "none",
        entitlementProductId: null,
        entitlementExpiresAt: null,
        revenueCatAppUserId: event.appUserId
      };

  const where = event.clerkUserId
    ? { authProviderId: event.clerkUserId }
    : { revenueCatAppUserId: event.appUserId };

  const user = await db.user.findFirst({ where });
  if (!user) return false;

  const legacy =
    source === "stripe" && patch.entitlementActive
      ? { plan: "premium" as const, subscriptionStatus: "active" as const }
      : patch.entitlementSource === "none"
        ? { plan: "free" as const, subscriptionStatus: "inactive" as const }
        : {};

  await db.user.update({
    where: { id: user.id },
    data: {
      ...patch,
      ...legacy
    }
  });

  return true;
}

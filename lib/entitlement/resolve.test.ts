import { describe, expect, it } from "vitest";
import { hasActiveVerifiedEntitlement } from "./resolve";

describe("hasActiveVerifiedEntitlement", () => {
  it("returns true for active stripe entitlement", () => {
    expect(
      hasActiveVerifiedEntitlement({
        entitlementActive: true,
        entitlementSource: "stripe",
        entitlementExpiresAt: null
      })
    ).toBe(true);
  });

  it("never treats identity alone as entitlement — inactive google_play flag off", () => {
    expect(
      hasActiveVerifiedEntitlement({
        entitlementActive: false,
        entitlementSource: "none",
        entitlementExpiresAt: null
      })
    ).toBe(false);
  });

  it("respects expiration", () => {
    expect(
      hasActiveVerifiedEntitlement({
        entitlementActive: true,
        entitlementSource: "app_store",
        entitlementExpiresAt: new Date(Date.now() - 60_000)
      })
    ).toBe(false);
  });

  it("allows active app_store from RevenueCat only", () => {
    expect(
      hasActiveVerifiedEntitlement({
        entitlementActive: true,
        entitlementSource: "app_store",
        entitlementExpiresAt: new Date(Date.now() + 86_400_000)
      })
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { resolveIdentityProviderFromClerkUser } from "./resolve-clerk-identity";

describe("resolveIdentityProviderFromClerkUser", () => {
  it("maps Apple OAuth without implying app_store entitlement", () => {
    expect(
      resolveIdentityProviderFromClerkUser({
        externalAccounts: [{ provider: "oauth_apple" }]
      } as never)
    ).toBe("apple");
  });

  it("maps Google OAuth without implying google_play entitlement", () => {
    expect(
      resolveIdentityProviderFromClerkUser({
        externalAccounts: [{ provider: "google" }]
      } as never)
    ).toBe("google");
  });

  it("falls back to email when password or email present", () => {
    expect(
      resolveIdentityProviderFromClerkUser({
        primaryEmailAddressId: "id",
        passwordEnabled: true,
        externalAccounts: []
      } as never)
    ).toBe("email");
  });
});

import type { User as ClerkUser } from "@clerk/backend";
import type { IdentityAuthProvider } from "@/lib/identity/types";

/**
 * Maps Clerk external accounts to website identity provider.
 * Apple/Google login here means "authenticated with that OAuth provider" only —
 * never iOS/Android customer or store entitlement.
 */
export function resolveIdentityProviderFromClerkUser(clerk: ClerkUser | null | undefined): IdentityAuthProvider {
  if (!clerk) return "unknown";

  const external = clerk.externalAccounts ?? [];
  const providers = new Set(
    external.map((a) => (typeof a.provider === "string" ? a.provider.toLowerCase() : "")).filter(Boolean)
  );

  if (providers.has("apple") || providers.has("oauth_apple")) return "apple";
  if (providers.has("google") || providers.has("oauth_google")) return "google";

  const hasVerifiedEmail =
    Boolean(clerk.primaryEmailAddressId) ||
    (clerk.emailAddresses?.length ?? 0) > 0 ||
    clerk.passwordEnabled === true;

  if (hasVerifiedEmail) return "email";

  return "unknown";
}

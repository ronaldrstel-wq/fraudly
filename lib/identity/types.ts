import type { AuthSurface, ClientPlatform, IdentityAuthProvider } from "@prisma/client";

export type { AuthSurface, ClientPlatform, IdentityAuthProvider };

export const AUTH_SURFACES = ["website", "ios", "android"] as const satisfies readonly AuthSurface[];
export const CLIENT_PLATFORMS = ["web", "ios", "android"] as const satisfies readonly ClientPlatform[];
export const IDENTITY_AUTH_PROVIDERS = ["apple", "google", "email", "unknown"] as const satisfies readonly IdentityAuthProvider[];

export type IdentityProfilePatch = {
  identityProvider: IdentityAuthProvider;
  lastAuthSurface: AuthSurface;
  email?: string | null;
};

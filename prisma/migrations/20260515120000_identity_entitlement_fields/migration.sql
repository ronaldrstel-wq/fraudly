-- Identity (who signed in) vs entitlement (what they purchased) vs platform (where request came from).

CREATE TYPE "IdentityAuthProvider" AS ENUM ('apple', 'google', 'email', 'unknown');
CREATE TYPE "AuthSurface" AS ENUM ('website', 'ios', 'android');
CREATE TYPE "EntitlementSource" AS ENUM ('none', 'stripe', 'app_store', 'google_play');
CREATE TYPE "ClientPlatform" AS ENUM ('web', 'ios', 'android');

ALTER TABLE "User" ADD COLUMN "identityProvider" "IdentityAuthProvider" NOT NULL DEFAULT 'unknown';
ALTER TABLE "User" ADD COLUMN "lastAuthSurface" "AuthSurface" NOT NULL DEFAULT 'website';
ALTER TABLE "User" ADD COLUMN "entitlementActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "entitlementSource" "EntitlementSource" NOT NULL DEFAULT 'none';
ALTER TABLE "User" ADD COLUMN "entitlementProductId" VARCHAR(128);
ALTER TABLE "User" ADD COLUMN "entitlementExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastDetectedPlatform" "ClientPlatform" NOT NULL DEFAULT 'web';
ALTER TABLE "User" ADD COLUMN "revenueCatAppUserId" VARCHAR(128);

CREATE UNIQUE INDEX "User_revenueCatAppUserId_key" ON "User"("revenueCatAppUserId");

-- Backfill Stripe premium rows into entitlement fields (identity provider stays unknown until next sign-in).
UPDATE "User"
SET
  "entitlementActive" = true,
  "entitlementSource" = 'stripe'
WHERE "plan" = 'premium' AND "subscriptionStatus" = 'active';

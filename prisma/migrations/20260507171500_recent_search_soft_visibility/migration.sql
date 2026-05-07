ALTER TABLE "RecentSearch"
ADD COLUMN "hiddenFromUserAt" TIMESTAMP(3),
ADD COLUMN "hiddenFromUserBy" VARCHAR(32),
ADD COLUMN "publicVisible" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "RecentSearch_publicVisible_createdAt_idx"
ON "RecentSearch" ("publicVisible", "createdAt" DESC);

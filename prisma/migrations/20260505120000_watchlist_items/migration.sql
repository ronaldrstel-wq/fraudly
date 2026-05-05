-- CreateEnum
CREATE TYPE "WatchlistItemType" AS ENUM ('domain', 'url', 'email', 'phone');

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "WatchlistItemType" NOT NULL,
    "externalKey" VARCHAR(768) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "detailPath" VARCHAR(2048) NOT NULL,
    "trustScore" INTEGER,
    "verdict" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_itemType_externalKey_key" ON "WatchlistItem"("userId", "itemType", "externalKey");

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

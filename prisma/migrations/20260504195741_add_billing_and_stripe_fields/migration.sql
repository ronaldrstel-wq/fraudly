-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'active', 'canceled', 'past_due');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "plan" "UserPlan" NOT NULL DEFAULT 'free',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "freeChecksUsed" INTEGER NOT NULL DEFAULT 0,
    "monthlyChecksUsed" INTEGER NOT NULL DEFAULT 0,
    "paidChecksCount" INTEGER NOT NULL DEFAULT 0,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

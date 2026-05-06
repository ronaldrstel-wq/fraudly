import { PrismaClient } from "@prisma/client";

declare global {
  var __fraudlyPrisma: PrismaClient | undefined;
}

export const db =
  global.__fraudlyPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__fraudlyPrisma = db;
}

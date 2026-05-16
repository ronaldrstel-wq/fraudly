import { Prisma } from "@prisma/client";

/** Public scam-alert reads: treat schema/connection failures as empty feed (never 500 the page). */
export function isPublicScamAlertsReadSkipped(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === "P2021" || err.code === "P1001" || err.code === "P2022" || err.code === "P2010";
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return false;
}

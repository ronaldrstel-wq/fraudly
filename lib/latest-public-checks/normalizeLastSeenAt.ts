/** Coerce Prisma / unstable_cache values to Date for feed rendering. */
export function normalizeLastSeenAt(value: Date | string | null | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return new Date(0);
}

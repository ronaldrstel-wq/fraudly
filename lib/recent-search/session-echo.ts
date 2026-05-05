export function sanitizeRecentSessionEcho(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().slice(0, 72).toLowerCase();
  return /^[\da-f-]{36}$/.test(v) ? v : null;
}

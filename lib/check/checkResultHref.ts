export type CheckResultRouteSource = "latest-card" | "recent" | "direct";

/** Public check detail URL; optional `scanId` loads the stored latest-public-check row. */
export function checkResultHref(
  domain: string,
  options?: { scanId?: string; from?: CheckResultRouteSource }
): string {
  const path = `/check/${encodeURIComponent(domain)}`;
  const q = new URLSearchParams();
  if (options?.scanId) q.set("scanId", options.scanId);
  if (options?.from) q.set("from", options.from);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

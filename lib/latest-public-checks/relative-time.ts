/** Short English relative labels for SSR (no extra dependencies). */
export function formatPublicCheckRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const secs = Math.max(0, Math.floor((nowMs - t) / 1000));

  if (secs < 60) return "just now";

  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins === 1 ? "1 min ago" : `${mins} min ago`;

  const hours = Math.floor(secs / 3600);
  if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hr ago`;

  const days = Math.floor(secs / 86_400);
  if (days < 21) return days === 1 ? "1 day ago" : `${days} days ago`;

  return new Date(iso).toLocaleDateString("en", { dateStyle: "medium" });
}

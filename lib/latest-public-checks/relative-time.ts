/** Short English relative labels for SSR (no extra dependencies). */
export function formatPublicCheckRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (secs < 45) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 36) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 21) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en", { dateStyle: "medium" });
}

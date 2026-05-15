/** Compact, honest stat display — no inflated “millions” styling. */
export function formatHomeStatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "—";
  if (value === 0) return "0";
  if (value >= 10_000) {
    const k = Math.floor(value / 1000);
    return `${k.toLocaleString("en-US")}k+`;
  }
  if (value >= 1_000) {
    const rounded = Math.floor(value / 100) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k+`;
  }
  return value.toLocaleString("en-US");
}

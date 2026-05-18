export function parseBackfillBoolParam(value: string | null, defaultValue: boolean): boolean {
  if (value == null || value === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
}

export function parseBackfillLimit(value: string | null, defaultValue = 50): number {
  const raw = Number.parseInt(value ?? String(defaultValue), 10);
  if (!Number.isFinite(raw) || raw < 1) return defaultValue;
  return Math.min(raw, 100);
}

export function parseBackfillMaxBatches(value: string | null, defaultValue = 500): number {
  const raw = Number.parseInt(value ?? String(defaultValue), 10);
  if (!Number.isFinite(raw) || raw < 1) return defaultValue;
  return Math.min(raw, 10_000);
}

export function parseBackfillMaxDurationMs(value: string | null, defaultValue = 55_000): number {
  const raw = Number.parseInt(value ?? String(defaultValue), 10);
  if (!Number.isFinite(raw) || raw < 1_000) return defaultValue;
  return Math.min(raw, 300_000);
}

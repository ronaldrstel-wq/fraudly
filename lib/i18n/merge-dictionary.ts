/** Deep-merge locale overrides onto English so missing nested keys never render undefined. */
export function deepMergeDictionary<T extends Record<string, unknown>>(fallback: T, override: Partial<T>): T {
  const out = { ...fallback };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const baseVal = fallback[key];
    const overrideVal = override[key];
    if (overrideVal === undefined) continue;
    if (
      baseVal &&
      overrideVal &&
      typeof baseVal === "object" &&
      typeof overrideVal === "object" &&
      !Array.isArray(baseVal) &&
      !Array.isArray(overrideVal)
    ) {
      out[key] = deepMergeDictionary(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>
      ) as T[keyof T];
    } else {
      out[key] = overrideVal as T[keyof T];
    }
  }
  return out;
}

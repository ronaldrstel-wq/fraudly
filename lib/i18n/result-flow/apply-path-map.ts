/** Apply dot-path string overrides onto a nested message tree (immutable). */
export function applyPathMap<T extends Record<string, unknown>>(base: T, map: Record<string, string>): T {
  if (!map || Object.keys(map).length === 0) return base;
  const out = structuredClone(base) as Record<string, unknown>;

  for (const [path, value] of Object.entries(map)) {
    const parts = path.split(".");
    let cur: Record<string, unknown> = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      const next = cur[key];
      if (typeof next !== "object" || next === null || Array.isArray(next)) {
        cur[key] = {};
      }
      cur = cur[key] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]!] = value;
  }

  return out as T;
}

/** Paths in `map` that are missing or still equal to English (dev diagnostics). */
export function missingResultFlowTranslations(
  en: Record<string, unknown>,
  localized: Record<string, unknown>,
  map: Record<string, string>
): string[] {
  const missing: string[] = [];
  for (const path of Object.keys(map)) {
    const enVal = readPath(en, path);
    const locVal = readPath(localized, path);
    if (typeof enVal !== "string" || typeof locVal !== "string") continue;
    if (locVal === enVal) missing.push(path);
  }
  return missing;
}

function readPath(root: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = root;
  for (const part of parts) {
    if (typeof cur !== "object" || cur === null || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

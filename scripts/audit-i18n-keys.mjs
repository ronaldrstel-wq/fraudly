#!/usr/bin/env node
/**
 * Compare core dictionary keys across locales. Run: node scripts/audit-i18n-keys.mjs
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flattenKeys(v, p));
    else keys.push(p);
  }
  return keys.sort();
}

const locales = ["en", "nl", "de", "fr", "es", "pt"];
const dicts = {};

for (const loc of locales) {
  const mod = require(`../lib/i18n/dictionaries/${loc}.ts`);
  dicts[loc] = flattenKeys(mod[loc]);
}

const en = new Set(dicts.en);
let failed = false;

for (const loc of locales.slice(1)) {
  const missing = dicts.en.filter((k) => !dicts[loc].includes(k));
  const extra = dicts[loc].filter((k) => !en.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.log(`\n${loc}:`);
    if (missing.length) console.log("  missing:", missing.join(", "));
    if (extra.length) console.log("  extra:", extra.join(", "));
  } else {
    console.log(`${loc}: OK (${dicts[loc].length} keys)`);
  }
}

if (failed) process.exit(1);
console.log("\nAll core dictionary locales aligned.");

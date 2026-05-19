#!/usr/bin/env node
/**
 * Regenerate lib/i18n/result-flow/translation-by-en.ts from _paths.json + embedded translations.
 * Run: node scripts/build-result-flow-translation-by-en.mjs
 *
 * Extend the setAll() calls below when adding new result-flow strings.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const paths = JSON.parse(fs.readFileSync(path.join(root, "lib/i18n/result-flow/_paths.json"), "utf8"));
const uniq = [...new Set(paths.map(([, s]) => s))].sort();

const T = {};
function setAll(en, nl, de, fr, es, pt) {
  T[en] = { nl, de, fr, es, pt };
}

// Import existing translations from current file when regenerating
const existingPath = path.join(root, "lib/i18n/result-flow/translation-by-en.ts");
if (fs.existsSync(existingPath)) {
  const existing = fs.readFileSync(existingPath, "utf8");
  for (const m of existing.matchAll(
    /"((?:[^"\\]|\\.)*)": \{ nl: "((?:[^"\\]|\\.)*)", de: "((?:[^"\\]|\\.)*)", fr: "((?:[^"\\]|\\.)*)", es: "((?:[^"\\]|\\.)*)", pt: "((?:[^"\\]|\\.)*)"/g
  )) {
    const unesc = (s) => s.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    T[unesc(m[1])] = { nl: unesc(m[2]), de: unesc(m[3]), fr: unesc(m[4]), es: unesc(m[5]), pt: unesc(m[6]) };
  }
}

// Add new setAll() batches here when extending copy…

for (const en of uniq) {
  if (!T[en]) T[en] = { nl: en, de: en, fr: en, es: en, pt: en };
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

let out = 'import type { Locale } from "@/lib/i18n/locales";\n\n';
out += "type Row = Record<Exclude<Locale, \"en\">, string>;\n\n";
out += "/** English source string → localized copy. Regenerate via scripts/build-result-flow-translation-by-en.mjs */\n";
out += "export const TRANSLATION_BY_EN: Record<string, Row> = {\n";
for (const en of uniq) {
  const row = T[en];
  out += `  "${esc(en)}": { nl: "${esc(row.nl)}", de: "${esc(row.de)}", fr: "${esc(row.fr)}", es: "${esc(row.es)}", pt: "${esc(row.pt)}" },\n`;
}
out += "};\n";

fs.writeFileSync(existingPath, out);
const miss = uniq.filter((en) => T[en].nl === en).length;
console.log(`Wrote ${uniq.length} entries; ${miss} still English in nl (extend script setAll batches).`);

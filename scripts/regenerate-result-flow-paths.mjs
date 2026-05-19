#!/usr/bin/env node
/** Regenerate lib/i18n/result-flow/_paths.json from result-flow/en.ts structure. */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

function flattenStrings(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.push([p, v]);
    else if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flattenStrings(v, p));
  }
  return out;
}

// Dynamic import of TS not trivial; read en structure from messages + checkPage inline
const { EN_MESSAGES } = await import(path.join(root, "lib/messages.en.ts"));
const checkPage = (await import(path.join(root, "lib/i18n/result-flow/en.ts"))).checkPageEn;

const tree = {
  scanResult: EN_MESSAGES.scanResult,
  threatOverride: EN_MESSAGES.threatOverride,
  paywall: EN_MESSAGES.paywall,
  check: { urlPlaceholder: EN_MESSAGES.check.urlPlaceholder, urlFieldLabel: EN_MESSAGES.check.urlFieldLabel },
  basicResult: EN_MESSAGES.basicResult,
  domainInfrastructure: EN_MESSAGES.domainInfrastructure,
  specialOutcomes: EN_MESSAGES.specialOutcomes,
  siteOutcome: EN_MESSAGES.siteOutcome,
  checkPage
};

const flat = flattenStrings(tree);
fs.writeFileSync(path.join(root, "lib/i18n/result-flow/_paths.json"), JSON.stringify(flat, null, 2));
console.log("Wrote", flat.length, "paths");

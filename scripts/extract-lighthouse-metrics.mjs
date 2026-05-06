import { readFileSync } from "node:fs";
import { basename } from "node:path";

function formatMs(value) {
  if (typeof value !== "number") return "n/a";
  return `${Math.round(value)} ms`;
}

function formatScore(score) {
  if (typeof score !== "number") return "n/a";
  return `${Math.round(score * 100)}`;
}

function formatDisplay(audit) {
  if (!audit) return "n/a";
  if (typeof audit.displayValue === "string" && audit.displayValue.length > 0) return audit.displayValue;
  if (typeof audit.numericValue === "number") return formatMs(audit.numericValue);
  return "n/a";
}

const reportPath = process.argv[2];
if (!reportPath) {
  console.error("Usage: node scripts/extract-lighthouse-metrics.mjs <report.json>");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const audits = report.audits ?? {};
const categories = report.categories ?? {};

const lcpInsightItems = audits["lcp-breakdown-insight"]?.details?.items ?? [];
const lcpNodeItem = lcpInsightItems.find((item) => item?.type === "node");

const perfScore = categories.performance?.score;
const metrics = {
  report: basename(reportPath),
  performanceScore: formatScore(perfScore),
  fcp: formatDisplay(audits["first-contentful-paint"]),
  lcp: formatDisplay(audits["largest-contentful-paint"]),
  tbt: formatDisplay(audits["total-blocking-time"]),
  cls: formatDisplay(audits["cumulative-layout-shift"]),
  speedIndex: formatDisplay(audits["speed-index"]),
  lcpElement: lcpNodeItem?.snippet ?? audits["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet ?? "n/a",
  unusedJavascript:
    audits["unused-javascript"]?.details?.overallSavingsMs != null
      ? `${Math.round(audits["unused-javascript"].details.overallSavingsMs)} ms potential savings`
      : audits["unused-javascript"]?.displayValue ?? "none reported",
  renderBlocking:
    audits["render-blocking-resources"]?.details?.overallSavingsMs != null
      ? `${Math.round(audits["render-blocking-resources"].details.overallSavingsMs)} ms potential savings`
      : audits["render-blocking-resources"]?.displayValue ?? "none reported"
};

console.log(JSON.stringify(metrics, null, 2));

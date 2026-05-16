#!/usr/bin/env node
/**
 * Verifies public production URLs do not return X-Robots-Tag: noindex/none.
 * Usage: SEO_CHECK_BASE_URL=https://fraudly.app node scripts/check-seo-headers.mjs
 */

const BASE = (process.env.SEO_CHECK_BASE_URL ?? "https://fraudly.app").replace(/\/$/, "");

const PUBLIC_PATHS = [
  "/",
  "/latest-checks",
  "/pulse",
  "/scam-alerts",
  "/how-it-works",
  "/features",
  "/learn",
  "/about",
  "/check/example.com",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap-0.xml"
];

const REDIRECT_CHECKS = [
  { path: "/latest", expectFinalIncludes: "/latest-checks" },
  { path: "/sitemap-0.xml", expectFinalIncludes: "/sitemap.xml" }
];

function parseRobotsTag(value) {
  if (!value) return [];
  return value
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isBlockingRobotsDirective(value) {
  const tags = parseRobotsTag(value);
  return tags.includes("noindex") || tags.includes("none");
}

function metaRobotsFromHtml(html) {
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
  if (!match) return null;
  const content = match[0].match(/content=["']([^"']+)["']/i);
  return content?.[1] ?? null;
}

function isHtmlPath(path) {
  return !path.endsWith(".txt") && !path.endsWith(".xml");
}

async function fetchWithRedirects(url, maxRedirects = 8) {
  let current = url;
  const chain = [];

  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": "Fraudly-SEO-Header-Check/1.0" }
    });
    chain.push({ url: current, status: res.status });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      current = new URL(location, current).toString();
      continue;
    }
    return { response: res, finalUrl: current, chain };
  }
  throw new Error(`Too many redirects for ${url}`);
}

function formatChain(chain) {
  if (chain.length <= 1) return "";
  return ` (${chain.map((c) => `${c.status}→${c.url}`).join(" → ")})`;
}

async function checkPath(path) {
  const url = `${BASE}${path}`;
  const { response, finalUrl, chain } = await fetchWithRedirects(url);
  const robots = response.headers.get("x-robots-tag");
  const headerBlocking = isBlockingRobotsDirective(robots);
  let metaRobots = null;
  let metaBlocking = false;

  const contentType = response.headers.get("content-type") ?? "";
  if (isHtmlPath(path) && contentType.includes("text/html") && response.ok) {
    const html = await response.text();
    metaRobots = metaRobotsFromHtml(html);
    metaBlocking = isBlockingRobotsDirective(metaRobots);
  }

  return {
    path,
    url,
    finalUrl,
    status: response.status,
    robots: robots ?? "(none)",
    metaRobots: metaRobots ?? "(none)",
    headerBlocking,
    metaBlocking,
    blocking: headerBlocking || metaBlocking,
    chain
  };
}

async function main() {
  console.log(`SEO header check — base: ${BASE}\n`);

  let failed = false;
  const warnings = [];

  for (const path of PUBLIC_PATHS) {
    try {
      const result = await checkPath(path);
      const chainNote = formatChain(result.chain);
      const flag = result.blocking ? "FAIL" : "OK";
      const metaLine =
        isHtmlPath(path) && result.metaRobots !== "(none)"
          ? `\n       meta robots: ${result.metaRobots}`
          : "";
      console.log(
        `[${flag}] ${path} → ${result.status} ${result.finalUrl}${chainNote}\n       x-robots-tag: ${result.robots}${metaLine}`
      );
      if (result.blocking) failed = true;
      if (result.status >= 400 && (path === "/robots.txt" || path === "/sitemap.xml")) {
        warnings.push(`${path} returned HTTP ${result.status}`);
      }
      if (path === "/sitemap-0.xml" && (result.status >= 400 || !result.finalUrl.includes("/sitemap.xml"))) {
        failed = true;
      }
    } catch (error) {
      console.log(`[ERR] ${path}: ${error instanceof Error ? error.message : String(error)}`);
      failed = true;
    }
  }

  for (const { path, expectFinalIncludes } of REDIRECT_CHECKS) {
    try {
      const result = await checkPath(path);
      const ok = result.finalUrl.includes(expectFinalIncludes);
      console.log(
        `[${ok ? "OK" : "FAIL"}] redirect ${path} → ${result.finalUrl} (expect *${expectFinalIncludes}*)`
      );
      if (!ok || result.blocking) failed = true;
    } catch (error) {
      console.log(`[ERR] redirect ${path}: ${error instanceof Error ? error.message : String(error)}`);
      failed = true;
    }
  }

  if (warnings.length) {
    console.log("\nWarnings:");
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (failed) {
    console.error(
      "\nSEO header check failed: blocking X-Robots-Tag and/or <meta name=\"robots\">, or redirect check failed."
    );
    process.exit(1);
  }

  console.log("\nSEO header check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Smoke-check public routes return HTTP 200 (or 404 for optional detail slug).
 * Usage: node scripts/smoke-public-routes.mjs [baseUrl]
 * Example: npm run smoke:routes -- http://127.0.0.1:3010
 */
const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const routes = [
  { path: "/", expect: 200 },
  { path: "/latest-checks", expect: 200 },
  { path: "/scam-alerts", expect: 200 },
  { path: "/about", expect: 200 },
  { path: "/terms", expect: 200 },
  { path: "/privacy", expect: 200 }
];

const optionalDetailSlug = process.env.SMOKE_SCAM_ALERT_SLUG?.trim();

async function checkRoute({ path, expect: expected }) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "FraudlySmoke/1.0" } });
  const ok = res.status === expected;
  return { path, url, status: res.status, expected, ok };
}

async function main() {
  const results = [];
  for (const route of routes) {
    results.push(await checkRoute(route));
  }

  if (optionalDetailSlug) {
    results.push(
      await checkRoute({
        path: `/scam-alerts/${encodeURIComponent(optionalDetailSlug)}`,
        expect: 200
      })
    );
  }

  for (const r of results) {
    const mark = r.ok ? "OK" : "FAIL";
    console.log(`${mark} ${r.status} ${r.path} (expected ${r.expected})`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} route(s) failed against ${base}`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} route(s) passed against ${base}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

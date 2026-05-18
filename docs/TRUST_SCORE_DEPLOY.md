# Trust score deploy checklist (Phase 4)

Production hardening for canonical trust fields, cache invalidation, and backfill.

---

## 1. Prisma migration safety

Migration: `prisma/migrations/20260516210000_latest_public_check_canonical_trust/migration.sql`

Adds **nullable** columns to `LatestPublicCheck`:

- `consumerVerdict`, `consumerVerdictLabel`, `consumerVerdictBand`
- `normalizedTrustScore`, `normalizedRiskScore`

The app **must work** when these columns are empty (legacy rows). Code falls back to `riskScoreSnapshot` + `standardVerdictLabel(trust)`.

### Local / CI

```bash
npx prisma migrate deploy
npx prisma generate
npm run typecheck
npm test
```

### Vercel deployment order

1. Application build runs **`prisma migrate deploy`** then `prisma generate` (`npm run build`). Requires `DATABASE_URL` at build time on Vercel.
2. Alternatively run `npm run migrate:deploy` against production **before** deploy if you prefer migrations outside the build step.
3. Run backfill (optional, recommended) — see below.
4. Monitor structured logs: `type: "trust_display_alignment"`.

**Do not** run `prisma migrate reset` on production.

### Verify schema

```bash
npx prisma validate
npx prisma migrate status
```

Admin schema probe (production):

```bash
curl -sS "https://fraudly.app/api/admin/backfill-latest-public-check-canonical" \
  -H "x-admin-key: $ADMIN_RECALC_KEY" | jq '.schemaCheck'
```

`readyForCanonicalBackfill` must be `true` before `dryRun=false` backfill (default). Use `?requireCanonical=false` only for legacy `riskScoreSnapshot`-only updates when migrations are still pending.

---

## 2. Backfill existing rows

Script: `scripts/backfill-latest-public-check-canonical-trust.ts`

Does **not** rescan domains. Parses `publicResultPayload` when possible.

### Production HTTP — full table (recommended)

No manual `nextCursor`. Processes all rows in batches; invalidates caches once at the end.

```bash
# Dry run
curl -sS -X POST "https://fraudly.app/api/admin/backfill-latest-public-check-canonical/run-all?dryRun=true&limit=50" \
  -H "x-admin-key: $ADMIN_RECALC_KEY" | jq

# Apply
curl -sS -X POST "https://fraudly.app/api/admin/backfill-latest-public-check-canonical/run-all?dryRun=false&limit=50" \
  -H "x-admin-key: $ADMIN_RECALC_KEY" | jq
```

If the table is large and Vercel hits the 60s limit, re-run with `resumeCursor` from the JSON response:

```bash
curl -sS -X POST "https://fraudly.app/api/admin/backfill-latest-public-check-canonical/run-all?dryRun=false&limit=50&cursor=<resumeCursor>" \
  -H "x-admin-key: $ADMIN_RECALC_KEY" | jq
```

Optional limits: `maxBatches=500` (default), `maxDurationMs=55000` (default).

### Dry run (local script)

```bash
BACKFILL_DRY_RUN=true BACKFILL_BATCH_SIZE=50 npx tsx scripts/backfill-latest-public-check-canonical-trust.ts
```

### Apply updates (local script)

```bash
BACKFILL_DRY_RUN=false BACKFILL_BATCH_SIZE=100 npx tsx scripts/backfill-latest-public-check-canonical-trust.ts
```

### Limit rows (staging test)

```bash
BACKFILL_DRY_RUN=false BACKFILL_BATCH_SIZE=25 BACKFILL_MAX_ROWS=100 npx tsx scripts/backfill-latest-public-check-canonical-trust.ts
```

Output JSON summary: `updated`, `skipped`, `failed`, `failureExamples`.

Rows without parseable payload are **skipped** (`no_parseable_payload`).

---

## 3. Cache & ISR behavior

| Surface | Behavior |
|---------|----------|
| `getCachedWebsiteAnalysis` | Per-domain `unstable_cache`, 1h TTL, tag `website-analysis-v3:{domain}` |
| After public snapshot persist | `revalidateTag` + `revalidatePath(/check/{domain})` only |
| `/check/[domain]` | `revalidate = 3600`; `?scanId=` uses dynamic `searchParams` (fresh request) |
| `/latest-checks` | `revalidate = 120`; feed tag `latest-public-checks-feed` invalidated on persist |
| `loadTrustViewForDomain` | Uses `storedResult` from snapshot when present (no stale analysis merge) |

Homepage and global routes are **not** revalidated on each scan.

---

## 4. Structured logging (production)

Env vars:

| Variable | Default | Purpose |
|----------|---------|---------|
| `TRUST_DISPLAY_LOG_SAMPLE_RATE` | `0.05` | Sample rate for aligned events |
| `TRUST_DISPLAY_LOG_ALWAYS` | off | Log every event (debug) |

Logs are JSON lines with `type: "trust_display_alignment"`. Mismatches always log at `warn`.

No PII: domain, scanId, scores, labels, source only.

---

## 5. Post-deploy smoke

```bash
npm run smoke:routes
```

Manual:

1. Run a live check → confirm API returns `trustScore`, `normalizedTrustResult`.
2. Open `/latest-checks` → card scores match detail page.
3. Open `/check/{domain}?scanId=` from latest card → same trust score.
4. Re-run backfill dry-run → `skipped` count rises (`already_canonical`).

---

## 6. Rollback

- New columns are nullable — older app revisions keep working.
- To rollback app only: redeploy previous build; DB columns can remain.
- Do not drop columns until mobile + web fully on canonical fields.

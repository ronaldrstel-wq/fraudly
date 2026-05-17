# Reputation provider audit (Google Reviews + Trustpilot)

## Provider inventory

| Provider | ID | When called | Env vars | Fallback | Cache TTL | Fields returned | UI display |
|----------|-----|-------------|----------|----------|-------------|-----------------|------------|
| Google indexed snippets | `google_indexed` | `getReviewSignals` / public intel during scan | `ENABLE_PUBLIC_INTEL_GOOGLE_INDEXED_REVIEWS` (default true) | First public baseline | Public intel cache (`withCache`) | `possibleRating`, `possibleReviewCount` | Limited · not scored |
| Outscraper Google Maps | `google_outscraper` | `getReputationEnrichment` when trigger met | `OUTSCRAPER_API_KEY`, `ENABLE_OUTSCRAPER_ENRICHMENT` | After indexed baseline | `ReputationEnrichmentCache` 30d success / 7d no-match / 24h error | `googleRating`, `googleReviewCount`, `googleLookup`, `googleMatchConfidence` | Verified when high + exact domain |
| Outscraper Trustpilot | `trustpilot_outscraper` | Same as Google Outscraper | Same | Public Trustpilot page | Same cache row | `trustpilotRating`, `trustpilotReviewCount`, lookup meta | Verified (high) / Limited (medium) |
| Trustpilot public page | `trustpilot_public_page` | `getReviewSignals` / `collectTrustpilot` | `ENABLE_PUBLIC_INTEL_TRUSTPILOT` | Before Outscraper | Public intel cache | rating, reviewCount | Limited · not scored |
| Google Places (optional) | — | Not wired in production path | `ENABLE_GOOGLE_PLACES_REVIEWS` (default **false**) | — | — | — | — |
| Trustpilot private API (optional) | — | Flag only | `ENABLE_TRUSTPILOT_PRIVATE_API` (default **false**) | — | — | — | — |
| Reputation cache | `reputation_cache` | `getReputationEnrichment` before live fetch | DB `ReputationEnrichmentCache` | Served when fresh | 30d / 7d / 24h per outcome | Full enrichment payload | Stale badge when expired |

Central merge: `lib/reputation/reputationProviderResolver.ts`  
Scan merge: `lib/reviewSignals/mergeEnrichment.ts` → `buildReviewSignalsFromEnrichment`  
Display: `lib/reputation/reviewChannelPresentation.ts`, `components/reputation/PublicReviewChannelCard.tsx`

## Root cause (Google)

1. **Merge gate too strict** — `mergeReviewSignalsWithEnrichment` only promoted Google when Outscraper returned `high` + exact domain, dropping indexed/legacy metrics when validation failed.
2. **Cache overwrite** — Failed enrichment responses could replace a `found` cache row with empty metrics.
3. **Confidence path** — Legacy `googleFound` + rating/count without enrichment fields were hidden until `googleReviewRules` fix; resolver now keeps indexed baseline as **Limited**.

## Trustpilot feasibility

- **Primary scored source:** Outscraper `/trustpilot/reviews` with domain/brand query validation (`trustpilotMatch.ts`).
- **Secondary display:** Public HTML scrape (`lib/public-intel/trustpilot.ts`) — Limited, never scored.
- **Not production:** Private Trustpilot API flag; no official Trustpilot API in codebase.
- **Absence is neutral** — No Trustpilot profile does not increase risk; channels show Unavailable/Limited, not negative signals.

## Fallback policy (resolver)

1. Verified fresh Outscraper (exact domain) wins display and score.
2. Indexed/public baseline shown as Limited when Outscraper fails or is low confidence.
3. Stale cache may display with Stale band (debug/cache row).
4. Conflicting ratings (≥0.75 apart) → Conflicting, hidden from score.
5. Failed fetch does not erase prior good cache (`mergeEnrichmentForCache`).

## Debug endpoint

`GET /api/admin/reputation-debug?domain=example.com`  
Header: `x-admin-recalc-key: $ADMIN_RECALC_KEY`

Returns provider inventory, call status, cache age, selected display/scoring sources, confidence reasons (no API keys).

## Recommended production settings

```env
ENABLE_PUBLIC_INTEL_ENRICHMENT=true
ENABLE_PUBLIC_INTEL_GOOGLE_INDEXED_REVIEWS=true
ENABLE_PUBLIC_INTEL_TRUSTPILOT=true
OUTSCRAPER_API_KEY=<secret>
ENABLE_OUTSCRAPER_ENRICHMENT=true
ENABLE_GOOGLE_PLACES_REVIEWS=false
ENABLE_TRUSTPILOT_PRIVATE_API=false
ADMIN_RECALC_KEY=<secret>
```

Run deep scans or scans with missing review coverage to trigger Outscraper enrichment.

## Tests

- `lib/reputation/reputationProviderResolver.test.ts`
- `lib/reviewSignals/mergeEnrichment.test.ts`
- `lib/reputation/googleReviewRules.test.ts`

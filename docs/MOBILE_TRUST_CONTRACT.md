# Mobile trust API contract

Fraudly mobile clients must treat the **canonical trust fields** on `POST /api/check` as the single source of truth for scores, verdicts, and colors.

Legacy fields remain for backwards compatibility but must not drive UI.

---

## Required fields (use these)

| Field | Type | Usage |
|-------|------|--------|
| `trustScore` | `number` (0–100) | Primary trust meter — higher is safer |
| `riskScore` | `number` (0–100) | Risk axis — higher is riskier |
| `consumerVerdictLabel` | string | Headline copy: `Likely Safe`, `Mostly Safe`, `Use Caution`, `Suspicious`, `High Risk` |
| `consumerVerdictBand` | string | Fine band: `likely-safe`, `mostly-safe`, `caution`, `suspicious`, `high-risk` |
| `consumerVerdictBandDisplay` | string | Coarse UI bucket: `trusted`, `caution`, `highRisk` |
| `scoreConfidence` | `high` \| `medium` \| `low` | Scan coverage / evidence completeness |
| `normalizedTrustResult` | object | Full consumer model (domain age, SSL, feeds, reputation channels) |

`consumerVerdict` is the legacy 3-tier API verdict (`safe` / `suspicious` / `scam`) — optional for analytics only.

---

## Do NOT use for UI

| Field | Why |
|-------|-----|
| `result.score` with `100 - score` | Skips threat caps and normalization |
| `result.verdict` | 3-tier API mapping ≠ 5-band consumer labels |
| `statusLabel` on public snapshots | Backwards-compatible metadata only |
| `LatestPublicCheck.statusLabel` | Same — never map to colors |

---

## Example response (excerpt)

```json
{
  "detailLevel": "full",
  "trustScore": 78,
  "riskScore": 22,
  "consumerVerdict": "safe",
  "consumerVerdictLabel": "Mostly Safe",
  "consumerVerdictBand": "mostly-safe",
  "consumerVerdictBandDisplay": "trusted",
  "scoreConfidence": "medium",
  "normalizedTrustResult": {
    "domain": "example.com",
    "trustScore": 78,
    "riskScore": 22,
    "verdict": "Mostly Safe",
    "scoreSource": "live_analysis",
    "domainAge": { "display": "10 years", "verified": true },
    "ssl": { "display": "HTTPS with valid certificate" },
    "feeds": { "status": "clean" },
    "reputation": { "google": { "found": false }, "trustpilot": { "found": false } }
  },
  "result": {
    "score": 22,
    "verdict": "safe",
    "domain": "example.com"
  }
}
```

---

## Recommended UI mapping

1. **Score ring / number** → `trustScore` (or `normalizedTrustResult.trustScore`).
2. **Headline** → `consumerVerdictLabel`.
3. **Color / icon band** → map `consumerVerdictBand` or `consumerVerdictBandDisplay` to your design tokens (do not re-derive from risk).
4. **Detail rows** (age, SSL, reviews) → `normalizedTrustResult` sub-objects only.
5. **Low coverage** → when `scoreConfidence === "low"`, show a subtle “Limited data” chip (not a scam accusation).

---

## Public snapshot / deep links

For `/check/{domain}?scanId={id}`:

- Prefer loading canonical columns + `publicResultPayload` v2 when available.
- Trust score on the card must match `normalizedTrustScore` on the snapshot row.
- Do not recompute trust from `statusLabel`.

---

## Backwards compatibility

- Older app versions may still read `result.verdict` — acceptable for crash-free rollout.
- New builds must switch to canonical fields before changing color thresholds.
- Server continues to send all legacy fields until mobile migration is complete.

---

## Versioning

`publicResultPayload.schemaVersion === 2` indicates embedded `normalizedTrustResult` + `canonical` block on snapshot rows.

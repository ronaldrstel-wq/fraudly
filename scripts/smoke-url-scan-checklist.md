# URL scan regression smoke checklist

Run after deploy or when touching `/api/check`, middleware, Clerk, rate limits, or analysis code.

**Prerequisites:** Browser or `curl` with cookies; production or staging with valid `RATE_LIMIT_HASH_SECRET`, DB, and optional intel keys (`OPENAI_API_KEY`, Safe Browsing key if enabled).

## 1. Anonymous first scan (homepage)

1. Clear site data for the origin (or incognito).
2. Open `/`.
3. Submit `example.com` → expect progress, then `ResultCard` with score/verdict; no 500.
4. Confirm `localStorage` / cookie path: second anonymous attempt should show sign-up prompt **before** request (client) or **401** with message (server if cookie path differs).

## 2. Signed-in scan (homepage)

1. Sign in via `/sign-in`.
2. Submit `https://www.apple.com` (or another stable HTTPS host).
3. Expect 200 JSON shape (`result.score`, `result.verdict`, …); `UserButton` still visible in nav.

## 3. Input shapes (same as unit tests; spot-check in UI)

| Input | Expected |
|-------|----------|
| `example.com` | Normalized to `https://example.com/…` |
| `http://example.com/path` | Preserves scheme/path |
| `https://shop.example.com/cart?x=1` | Subdomain + path + query |
| `billing-meta.program-ads-agency.com` | Multi-label host accepted |
| `mailto:test@x.com` | Friendly invalid error, no crash |

## 4. API quick probe (`curl`)

```bash
# Replace ORIGIN; send minimal JSON (anonymous — may 401 if cookie already used)
curl -sS -X POST "$ORIGIN/api/check" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","detailLevel":"full","language":"en"}' | head -c 400
```

Expect JSON with `result` object, or structured `401`/`429`/`503` (misconfigured pepper), not HTML error page.

## 5. Middleware / SEO side effects

- `curl -sI "$ORIGIN/"` on production host: no `X-Robots-Tag: noindex`.
- Preview host: may include `X-Robots-Tag: noindex` (intended).
- `/api/check` not blocked (non-404 from middleware for POST).

## 6. Latest public checks

After a successful scan of a publishable host, open `/latest-checks` and confirm a new or updated row (subject to `classifyWebsiteCheckForPublication` gates).

## 7. Rate limits

- Trigger many rapid scans from one session (respect ToS); expect `429` with `reason` and friendly `message`, not raw IP/UA in JSON.

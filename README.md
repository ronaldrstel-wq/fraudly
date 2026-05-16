# Fraudly

Simple scam-checking MVP built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- Paste a URL and check scam risk instantly
- Risk score from 0-100 with verdict:
  - 0-30: Likely safe
  - 31-70: Suspicious
  - 71-100: Likely scam
- 2-3 short reasons for the result
- URL validation and loading state
- Reusable `URLInput` and `ResultCard` components

## Run

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## IndexNow (search engine URL submission)

Fraudly notifies Bing/Yandex and other IndexNow partners when you publish URLs, using the [IndexNow](https://www.indexnow.org/) protocol.

**Important:** Only canonical apex-domain URLs are accepted by our IndexNow submitter.

- **Allowed:** `https://fraudly.app/...`
- **Rejected:** `https://www.fraudly.app/...`

**Reason:** Fraudly uses `https://fraudly.app` as the canonical domain, so always submit apex URLs to IndexNow.

### Setup

1. **Key file (production)**  
   The verification key is served as a static file at:

   `https://fraudly.app/<INDEXNOW_KEY>.txt`

   The file must contain exactly the key (one line), matching `INDEXNOW_KEY` in the environment.

2. **Environment variable**  
   Set **`INDEXNOW_KEY`** to the same string as in that file.

   - **Local:** add it to `.env.local` (this file is gitignored).
   - **Vercel:** Project → Settings → Environment Variables → add `INDEXNOW_KEY` for Production (and Preview if needed).

3. **Submit URLs (admin API)**  
   `POST /api/admin/indexnow-submit` with header **`x-admin-key`** set to **`ADMIN_RECALC_KEY`**, and JSON body:

   ```json
   { "urls": ["https://fraudly.app/learn"] }
   ```

   Only `https://fraudly.app` URLs are accepted; duplicates are removed. Paths under `/account`, `/dashboard`, `/sign-in`, `/sign-up`, and `/api` are rejected.

### Verify the key file

Open in a browser:

`https://fraudly.app/<INDEXNOW_KEY>.txt`

You should see only the key text.

### Example curl (production)

Replace `<ADMIN_RECALC_KEY>` and optionally use a real path:

```bash
curl -sS -X POST 'https://fraudly.app/api/admin/indexnow-submit' \
  -H 'Content-Type: application/json' \
  -H 'x-admin-key: <ADMIN_RECALC_KEY>' \
  -d '{"urls":["https://fraudly.app/","https://fraudly.app/learn"]}'
```

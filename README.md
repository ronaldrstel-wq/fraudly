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

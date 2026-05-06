# Lighthouse performance test workflow

This project includes repeatable scripts for running Lighthouse against the production build.

## 1) Build production assets

```bash
npm run perf:build
```

## 2) Start production server

```bash
npm run perf:start
```

The server runs on `http://127.0.0.1:3010`.

## 3) Run Lighthouse (mobile + desktop)

In a second terminal:

```bash
npm run perf:lighthouse:mobile
npm run perf:lighthouse:desktop
```

## 4) Output location

Reports are written to `performance-reports/`:

- `lighthouse-mobile.report.html`
- `lighthouse-mobile.report.json`
- `lighthouse-desktop.report.html`
- `lighthouse-desktop.report.json`

Each script also prints extracted key metrics from the JSON file:

- Performance score
- FCP
- LCP
- TBT
- CLS
- Speed Index
- LCP element snippet
- Unused JavaScript warning summary
- Render-blocking resources warning summary

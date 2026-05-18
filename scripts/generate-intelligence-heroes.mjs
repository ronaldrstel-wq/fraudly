#!/usr/bin/env node
/**
 * Generates branded Fraudly Intelligence hero SVGs (1200×630).
 * Run: node scripts/generate-intelligence-heroes.mjs
 */
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public/images/intelligence");

const C = {
  blue: "#2563eb",
  blueLight: "#3b82f6",
  indigo: "#4f46e5",
  violet: "#7c3aed",
  mint: "#059669",
  mintLight: "#10b981",
  amber: "#d97706",
  red: "#dc2626",
  slate: "#475569",
  slateLight: "#64748b",
  border: "#93c5fd",
  borderSoft: "#cbd5e1",
  card: "#ffffff",
  text: "#0f172a",
  textMuted: "#475569"
};

function shell({ id, label, children }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="${id}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="45%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0fdf4"/>
    </linearGradient>
    <linearGradient id="${id}-card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="${id}-accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C.blue}"/>
      <stop offset="100%" stop-color="${C.violet}"/>
    </linearGradient>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#1e3a8a" flood-opacity="0.11"/>
    </filter>
    <filter id="${id}-shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#334155" flood-opacity="0.09"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#${id}-bg)"/>
  <ellipse cx="920" cy="120" rx="200" ry="160" fill="${C.violet}" fill-opacity="0.1"/>
  <ellipse cx="180" cy="520" rx="240" ry="180" fill="${C.blue}" fill-opacity="0.11"/>
  <ellipse cx="600" cy="80" rx="120" ry="80" fill="${C.mint}" fill-opacity="0.1"/>
  ${children}
</svg>`;
}

function card(x, y, w, h, r = 20, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#card-fill)" stroke="${C.borderSoft}" stroke-width="1.5" filter="url(#shadow)" ${extra}/>`;
}

/** Shared card fill reference - each svg uses its own id prefix */
function fraudlyBadge(x, y, accentId) {
  return `<g transform="translate(${x},${y})">
    <rect width="118" height="28" rx="14" fill="${C.blue}" fill-opacity="0.1" stroke="${C.border}" stroke-width="1"/>
    <circle cx="16" cy="14" r="6" fill="url(#${accentId})"/>
    <text x="28" y="18" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="${C.blue}" letter-spacing="0.04em">FRAUDLY</text>
  </g>`;
}

const illustrations = {
  "how-to-detect-fake-webshops": {
    label: "Fake webshop detection — browser, discount trap, and warning",
    body: (id) => `
  <g filter="url(#${id}-shadow)">
    <!-- Browser window -->
    <rect x="280" y="95" width="640" height="420" rx="24" fill="url(#${id}-card)" stroke="${C.border}" stroke-width="2"/>
    <rect x="280" y="95" width="640" height="52" rx="24" fill="#f1f5f9"/>
    <rect x="280" y="123" width="640" height="24" fill="#f1f5f9"/>
    <circle cx="318" cy="121" r="8" fill="#fca5a5"/><circle cx="346" cy="121" r="8" fill="#fcd34d"/><circle cx="374" cy="121" r="8" fill="#86efac"/>
    <rect x="420" y="108" width="360" height="26" rx="8" fill="#fff" stroke="${C.borderSoft}" stroke-width="1.5"/>
    <text x="440" y="126" font-family="system-ui,sans-serif" font-size="13" fill="${C.slate}">suspicious-deals-shop.net</text>

    <!-- Product card in browser -->
    <rect x="320" y="175" width="260" height="300" rx="16" fill="#fff" stroke="${C.borderSoft}" stroke-width="1.5"/>
    <rect x="340" y="195" width="220" height="140" rx="12" fill="url(#${id}-accent)" fill-opacity="0.12"/>
    <rect x="340" y="355" width="140" height="14" rx="4" fill="#e2e8f0"/>
    <rect x="340" y="380" width="90" height="12" rx="4" fill="#e2e8f0"/>
    <text x="490" y="420" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="${C.red}">-92%</text>

    <!-- Fake discount tag -->
    <g transform="translate(520,165) rotate(-8)">
      <rect width="130" height="44" rx="10" fill="${C.amber}" filter="url(#${id}-shadow-sm)"/>
      <text x="16" y="28" font-family="system-ui,sans-serif" font-size="15" font-weight="800" fill="#fff">FLASH SALE</text>
    </g>

    <!-- Warning badge -->
    <g transform="translate(720,200)">
      <circle cx="52" cy="52" r="52" fill="#fef2f2" stroke="${C.red}" stroke-width="2.5"/>
      <path d="M52 28 L68 72 H36 Z" fill="none" stroke="${C.red}" stroke-width="3" stroke-linejoin="round"/>
      <line x1="52" y1="44" x2="52" y2="58" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="52" cy="66" r="2.5" fill="${C.red}"/>
      <text x="52" y="128" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="${C.red}">High risk</text>
    </g>

    <!-- Shopping bag icon -->
    <g transform="translate(620,280)" fill="none" stroke="url(#${id}-accent)" stroke-width="3">
      <path d="M20 35h80l-10 55H30L20 35z"/><path d="M38 35V22a22 22 0 0 1 44 0v13"/>
    </g>
  </g>
  ${fraudlyBadge(320, 520, `${id}-accent`)}
  <text x="600" y="575" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${C.slateLight}">Consumer Safety Guide</text>`,
  },

  "common-paypal-phishing-scams": {
    label: "Phishing awareness — suspicious email and unsafe link",
    body: (id) => `
  <g filter="url(#${id}-shadow)">
    <!-- Email / message bubble -->
    <rect x="240" y="110" width="520" height="380" rx="24" fill="url(#${id}-card)" stroke="${C.border}" stroke-width="2"/>
    <rect x="240" y="110" width="520" height="56" rx="24" fill="#f8fafc"/>
    <rect x="240" y="142" width="520" height="24" fill="#f8fafc"/>
    <circle cx="280" cy="138" r="18" fill="url(#${id}-accent)" fill-opacity="0.25"/>
    <text x="310" y="145" font-family="system-ui,sans-serif" font-size="15" font-weight="600" fill="${C.text}">Payment update required</text>
    <text x="270" y="200" font-family="system-ui,sans-serif" font-size="14" fill="${C.textMuted}">Your account will be limited unless you</text>
    <text x="270" y="228" font-family="system-ui,sans-serif" font-size="14" fill="${C.textMuted}">confirm your details immediately.</text>

    <!-- Suspicious link pill -->
    <rect x="270" y="260" width="420" height="48" rx="12" fill="#fef2f2" stroke="${C.red}" stroke-width="1.5" stroke-dasharray="6 4"/>
    <text x="290" y="290" font-family="ui-monospace,monospace" font-size="13" fill="${C.red}">paypa1-secure-verify.xyz/login</text>
    <text x="270" y="340" font-family="system-ui,sans-serif" font-size="12" fill="${C.slateLight}">⚠ Link does not match official domain</text>
  </g>

  <!-- Shield with check -->
  <g transform="translate(820,140)" filter="url(#${id}-shadow-sm)">
    <rect width="200" height="240" rx="20" fill="#fff" stroke="${C.border}" stroke-width="2"/>
    <path d="M100 40 L160 62 V130 C160 178 100 200 100 200 C100 200 40 178 40 130 V62 Z" fill="none" stroke="url(#${id}-accent)" stroke-width="3"/>
    <path d="M72 128 L92 148 L132 98" fill="none" stroke="${C.mint}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="100" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${C.mint}">Verify first</text>
  </g>

  <!-- Message tail -->
  <path d="M240 350 L200 400 L260 380 Z" fill="#fff" stroke="${C.borderSoft}" stroke-width="1.5"/>

  ${fraudlyBadge(280, 520, `${id}-accent`)}
  <text x="600" y="575" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${C.slateLight}">Threat Awareness</text>`
  },

  "how-scammers-fake-trustpilot-reviews": {
    label: "Fake reviews — inflated stars and manipulated trust score",
    body: (id) => `
  <g filter="url(#${id}-shadow)">
    <!-- Trust score card -->
    <rect x="300" y="100" width="340" height="400" rx="24" fill="url(#${id}-card)" stroke="${C.border}" stroke-width="2"/>
    <text x="330" y="150" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="${C.slate}">Trust score</text>
    <text x="330" y="220" font-family="system-ui,sans-serif" font-size="64" font-weight="800" fill="url(#${id}-accent)">4.9</text>
    <text x="330" y="252" font-family="system-ui,sans-serif" font-size="13" fill="${C.slateLight}">Based on 2,847 reviews</text>

    <!-- Stars row -->
    <g transform="translate(330,270)">
      ${[0, 1, 2, 3, 4]
        .map(
          (i) =>
            `<polygon points="${i * 44},0 ${i * 44 + 14},28 ${i * 44 + 36},28 ${i * 44 + 20},44 ${i * 44 + 26},68 ${i * 44 + 12},54 ${i * 44 - 2},68 ${i * 44 + 8},44 ${i * 44 - 8},28 ${i * 44 + 6},28" fill="${C.amber}" stroke="${C.amber}" stroke-width="1"/>`
        )
        .join("")}
    </g>

    <!-- Fake review snippets -->
    <rect x="330" y="350" width="280" height="36" rx="8" fill="#f1f5f9"/>
    <rect x="330" y="398" width="220" height="36" rx="8" fill="#f1f5f9"/>
    <rect x="330" y="446" width="250" height="36" rx="8" fill="#f1f5f9"/>
  </g>

  <!-- Warning marker -->
  <g transform="translate(700,120)" filter="url(#${id}-shadow-sm)">
    <rect width="280" height="200" rx="20" fill="#fffbeb" stroke="${C.amber}" stroke-width="2"/>
    <circle cx="48" cy="48" r="28" fill="${C.amber}" fill-opacity="0.2"/>
    <text x="48" y="56" text-anchor="middle" font-size="28">!</text>
    <text x="90" y="52" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="${C.text}">Review pattern alert</text>
    <text x="90" y="78" font-family="system-ui,sans-serif" font-size="13" fill="${C.textMuted}">Burst of 5★ in 48 hours</text>
    <text x="90" y="102" font-family="system-ui,sans-serif" font-size="13" fill="${C.textMuted}">Generic wording detected</text>
    <rect x="24" y="130" width="232" height="48" rx="10" fill="#fff" stroke="${C.borderSoft}" stroke-width="1"/>
    <text x="40" y="160" font-family="system-ui,sans-serif" font-size="12" fill="${C.red}">⚠ Likely manipulated</text>
  </g>

  <!-- Secondary stars (dimmed) -->
  <g transform="translate(720,360)" opacity="0.5">
    ${[0, 1, 2]
      .map(
        (i) =>
          `<polygon points="${i * 36},0 ${i * 36 + 11},22 ${i * 36 + 29},22 ${i * 36 + 16},34 ${i * 36 + 21},54 ${i * 36 + 10},42 ${i * 36 - 1},54 ${i * 36 + 6},34 ${i * 36 - 6},22 ${i * 36 + 5},22" fill="${C.slateLight}"/>`
      )
      .join("")}
  </g>

  ${fraudlyBadge(320, 520, `${id}-accent`)}
  <text x="600" y="575" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${C.slateLight}">Scam Intelligence</text>`
  },

  "how-to-check-if-a-website-is-safe": {
    label: "Website safety — secure checkout and payment risk check",
    body: (id) => `
  <g filter="url(#${id}-shadow)">
    <!-- Payment / checkout card -->
    <rect x="260" y="120" width="380" height="340" rx="24" fill="url(#${id}-card)" stroke="${C.border}" stroke-width="2"/>
    <text x="300" y="170" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="${C.slate}">Checkout</text>
    <rect x="300" y="190" width="300" height="56" rx="12" fill="#f8fafc" stroke="${C.borderSoft}" stroke-width="1.5"/>
    <rect x="320" y="210" width="120" height="16" rx="4" fill="#e2e8f0"/>
    <text x="300" y="280" font-family="system-ui,sans-serif" font-size="13" fill="${C.textMuted}">Order total</text>
    <text x="300" y="310" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="${C.text}">€ 149.00</text>

    <!-- Lock + secure -->
    <g transform="translate(300,330)">
      <rect width="140" height="44" rx="10" fill="#ecfdf5" stroke="${C.mint}" stroke-width="1.5"/>
      <rect x="16" y="12" width="20" height="24" rx="4" fill="none" stroke="${C.mint}" stroke-width="2"/>
      <path d="M20 12 V8 a12 12 0 0 1 24 0 v4" fill="none" stroke="${C.mint}" stroke-width="2"/>
      <text x="48" y="28" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${C.mint}">HTTPS</text>
    </g>

    <!-- Risk indicator (amber) -->
    <g transform="translate(460,330)">
      <rect width="140" height="44" rx="10" fill="#fffbeb" stroke="${C.amber}" stroke-width="1.5"/>
      <circle cx="24" cy="22" r="10" fill="${C.amber}" fill-opacity="0.3"/>
      <text x="24" y="27" text-anchor="middle" font-size="14" font-weight="700" fill="${C.amber}">!</text>
      <text x="44" y="28" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${C.amber}">Review risk</text>
    </g>

    <rect x="300" y="395" width="300" height="48" rx="12" fill="url(#${id}-accent)" fill-opacity="0.15" stroke="url(#${id}-accent)" stroke-width="1.5"/>
    <text x="450" y="426" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="${C.blue}">Run safety check</text>
  </g>

  <!-- Browser safety panel -->
  <g transform="translate(700,100)" filter="url(#${id}-shadow-sm)">
    <rect width="320" height="380" rx="24" fill="#fff" stroke="${C.border}" stroke-width="2"/>
    <rect x="0" y="0" width="320" height="48" rx="24" fill="#f1f5f9"/>
    <rect x="0" y="24" width="320" height="24" fill="#f1f5f9"/>
    <circle cx="36" cy="24" r="7" fill="#fca5a5"/><circle cx="58" cy="24" r="7" fill="#fcd34d"/><circle cx="80" cy="24" r="7" fill="#86efac"/>
    <rect x="100" y="14" width="180" height="22" rx="6" fill="#fff" stroke="${C.borderSoft}" stroke-width="1"/>
    <text x="115" y="30" font-family="system-ui,sans-serif" font-size="11" fill="${C.slate}">trusted-store.com</text>

    <g transform="translate(80,100)">
      <circle cx="80" cy="80" r="70" fill="#eff6ff" stroke="url(#${id}-accent)" stroke-width="3"/>
      <path d="M50 82 L72 104 L118 58" fill="none" stroke="${C.mint}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="160" y="280" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="${C.mint}">Safer to proceed</text>
    <text x="160" y="305" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="${C.slateLight}">Domain · SSL · reputation</text>
  </g>

  ${fraudlyBadge(280, 520, `${id}-accent`)}
  <text x="600" y="575" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${C.slateLight}">Fraud Prevention</text>`
  },

  "top-warning-signs-of-a-scam-website": {
    label: "Scam website warning signs — social ad lure, risky URL, and red-flag checklist",
    body: (id) => `
  <!-- Central warning hub -->
  <g transform="translate(600,300)" filter="url(#${id}-shadow)">
    <circle cx="0" cy="0" r="118" fill="#fffbeb" stroke="${C.amber}" stroke-width="3"/>
    <circle cx="0" cy="0" r="98" fill="#fff" stroke="#fde68a" stroke-width="2"/>
    <path d="M0 -58 L50 42 H-50 Z" fill="none" stroke="${C.amber}" stroke-width="4" stroke-linejoin="round"/>
    <line x1="0" y1="-18" x2="0" y2="8" stroke="${C.amber}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="0" cy="24" r="4" fill="${C.amber}"/>
    <text y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="800" fill="${C.text}">Scam risk</text>
  </g>

  <!-- Social ad card (top-left) -->
  <g transform="translate(200,95) rotate(-4)" filter="url(#${id}-shadow)">
    <rect width="300" height="340" rx="22" fill="url(#${id}-card)" stroke="${C.border}" stroke-width="2.5"/>
    <rect width="300" height="56" rx="22" fill="#f8fafc"/>
    <rect y="32" width="300" height="24" fill="#f8fafc"/>
    <circle cx="36" cy="28" r="16" fill="url(#${id}-accent)" fill-opacity="0.25"/>
    <text x="64" y="24" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="${C.text}">Sponsored · Ad</text>
    <text x="64" y="44" font-family="system-ui,sans-serif" font-size="11" fill="${C.slateLight}">Promoted deal</text>
    <rect x="20" y="72" width="260" height="130" rx="14" fill="url(#${id}-accent)" fill-opacity="0.14" stroke="${C.borderSoft}" stroke-width="1.5"/>
    <text x="150" y="130" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="800" fill="${C.violet}">MEGA SALE</text>
    <text x="150" y="168" text-anchor="middle" font-family="system-ui,sans-serif" font-size="34" font-weight="900" fill="${C.red}">90% OFF</text>
    <g transform="translate(210,62) rotate(8)">
      <rect width="96" height="34" rx="8" fill="${C.red}"/>
      <text x="10" y="23" font-family="system-ui,sans-serif" font-size="12" font-weight="800" fill="#fff">TODAY ONLY</text>
    </g>
    <rect x="20" y="220" width="260" height="44" rx="11" fill="url(#${id}-accent)" fill-opacity="0.22"/>
    <text x="150" y="249" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="${C.blue}">Shop now →</text>
    <rect x="20" y="278" width="180" height="10" rx="4" fill="#e2e8f0"/>
    <rect x="20" y="298" width="120" height="10" rx="4" fill="#e2e8f0"/>
  </g>

  <!-- Browser / risky URL strip (top-right) -->
  <g transform="translate(780,110)" filter="url(#${id}-shadow-sm)">
    <rect width="340" height="200" rx="20" fill="#fff" stroke="${C.border}" stroke-width="2.5"/>
    <rect width="340" height="44" rx="20" fill="#f1f5f9"/>
    <rect y="20" width="340" height="24" fill="#f1f5f9"/>
    <circle cx="32" cy="22" r="7" fill="#fca5a5"/><circle cx="52" cy="22" r="7" fill="#fcd34d"/><circle cx="72" cy="22" r="7" fill="#86efac"/>
    <rect x="96" y="12" width="220" height="24" rx="7" fill="#fef2f2" stroke="${C.red}" stroke-width="1.5"/>
    <text x="110" y="29" font-family="ui-monospace,monospace" font-size="12" font-weight="600" fill="${C.red}">mega-deals-now.shop</text>
    <g transform="translate(24,68)">
      <rect width="292" height="44" rx="10" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5"/>
      <circle cx="22" cy="22" r="12" fill="${C.amber}" fill-opacity="0.2"/>
      <text x="22" y="27" text-anchor="middle" font-size="14" font-weight="700" fill="${C.amber}">!</text>
      <text x="44" y="27" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${C.text}">Domain registered 12 days ago</text>
    </g>
    <g transform="translate(24,124)">
      <rect width="292" height="44" rx="10" fill="#fef2f2" stroke="#fecaca" stroke-width="1.5"/>
      <circle cx="22" cy="22" r="12" fill="${C.red}" fill-opacity="0.15"/>
      <text x="22" y="27" text-anchor="middle" font-size="14" font-weight="700" fill="${C.red}">!</text>
      <text x="44" y="27" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${C.text}">No real company address</text>
    </g>
  </g>

  <!-- Red-flag checklist (bottom) -->
  <g transform="translate(260,455)" filter="url(#${id}-shadow-sm)">
    <rect width="680" height="120" rx="20" fill="#fff" stroke="${C.border}" stroke-width="2.5"/>
    <text x="24" y="36" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="${C.text}">Warning sign checklist</text>
    <g transform="translate(24,52)">
      <rect width="148" height="52" rx="12" fill="#fef2f2" stroke="#fecaca" stroke-width="1.5"/>
      <text x="74" y="22" text-anchor="middle" font-size="18">🏷️</text>
      <text x="74" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${C.red}">Fake discount</text>
    </g>
    <g transform="translate(184,52)">
      <rect width="148" height="52" rx="12" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5"/>
      <text x="74" y="22" text-anchor="middle" font-size="18">⏱️</text>
      <text x="74" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${C.amber}">Urgency trap</text>
    </g>
    <g transform="translate(344,52)">
      <rect width="148" height="52" rx="12" fill="#eff6ff" stroke="${C.border}" stroke-width="1.5"/>
      <text x="74" y="22" text-anchor="middle" font-size="18">🔗</text>
      <text x="74" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${C.blue}">Odd URL</text>
    </g>
    <g transform="translate(504,52)">
      <rect width="148" height="52" rx="12" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
      <text x="74" y="22" text-anchor="middle" font-size="18">🛡️</text>
      <text x="74" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${C.mint}">Verify first</text>
    </g>
  </g>

  ${fraudlyBadge(480, 585, `${id}-accent`)}
  <text x="600" y="618" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="${C.slate}">Scam Intelligence</text>`
  }
};

for (const [slug, { label, body }] of Object.entries(illustrations)) {
  const id = slug.replace(/[^a-z0-9]/g, "");
  const svg = shell({ id, label, children: body(id) });
  const file = path.join(OUT, `${slug}-hero.svg`);
  fs.writeFileSync(file, svg);
  console.log("wrote", path.basename(file));
}

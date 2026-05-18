/** SEO meta description length targets (Google typically shows ~150–160 chars). */
export const SEO_DESCRIPTION_MIN = 25;
export const SEO_DESCRIPTION_MAX = 160;
export const SEO_DESCRIPTION_TARGET_MIN = 120;
export const SEO_DESCRIPTION_TARGET_MAX = 155;

/**
 * Unique browser titles (layout adds `| Fraudly` unless `titleAbsolute` is set).
 * Keyword themes are distributed across routes—never stuffed on one page.
 */
export const SEO_TITLE = {
  homeAbsolute: "Check if a Website or Webshop Is Safe | Fraudly",
  about: "About Fraudly — Website Trust & Scam Checker",
  pricing: "Pricing — Scam Checker & Trust Plans",
  howItWorks: "How It Works — Scam Checker & Phishing Detection",
  latestChecks: "Latest Website Trust Checks",
  learn: "Learn — Fake Webshop & Phishing Guides",
  blog: "Blog — Scam Awareness & Website Safety Guides",
  intelligence: "Fraudly Intelligence — Scam & Website Safety Guides",
  features: "Features — Phishing Detection & Trust Analysis",
  pulse: "Fraudly Pulse — Live Scam & Phishing Trends",
  scamAlerts: "Threat Alerts — Scam & Phishing Intelligence",
  supportAbsolute: "Support & FAQ — Website Trust Checker Help",
  scamChecker: "Online Scam Checker — Is This Site Safe?",
  phishingChecker: "Phishing Checker — Safe Link Checker",
  fakeWebsiteChecker: "Fake Webshop & Website Checker",
  emailScamChecker: "Email Scam Checker — Safe Link Checker",
  cryptoScamChecker: "Crypto Scam Checker — Website Trust Check",
  websiteScamChecker: "Website Scam Checker — Verify URLs Before You Pay",
  checkIfWebsiteIsSafe: "Check if a Website Is Safe — Free Trust Review",
  fakeWebshopCheck: "Fake Webshop Check — Spot Suspicious Online Stores",
  onlineScamDetector: "Online Scam Detector — Website & Link Risk Check",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  cookies: "Cookie Policy",
  disclaimer: "Disclaimer — Scam Checker Limits",
  scamHelp: "Scam Help — What to Do If You Were Scammed",
  scamHelpCountry: (country: string) => `Scam Help — ${country}`,
  signIn: "Sign In",
  signUp: "Create Account",
  recentSearches: "Recent Searches",
  admin: "Admin Tools",
  adminScamAlerts: "Admin Scam Alerts",
  checkInvalid: "Website Check",
  checkResult: (domain: string) => `Is ${domain} Safe? Website Trust Check`,
  domainIntel: (domain: string) => `Is ${domain} Legit? Scam & Trust Check`
} as const;

/** Canonical static descriptions for public routes (120–155 chars where possible). */
export const SEO_DESCRIPTION = {
  home: "Check if a website or online shop is safe with Fraudly. Webshop safety check, shop scam signals, and phishing detection before you buy.",
  about:
    "Learn how Fraudly's website trust check helps you avoid scams, phishing and fake webshops—online fraud protection through clear domain and store analysis.",
  pricing:
    "Upgrade for deeper scam checker scans, reputation monitoring and online fraud protection—advanced website trust checks on suspicious links and webshops.",
  scanResult:
    "Fraudly website trust check: phishing detection, fake webshop signals and scam checker results for one URL—safe link checker output, not a guarantee.",
  latestChecks:
    "View recent website trust checks and scam checker results from Fraudly—phishing detection and fake webshop signals in real-time public summaries.",
  howItWorks:
    "See how Fraudly's scam checker combines phishing detection, reputation data and domain analysis to flag suspicious sites—your safe link checker workflow.",
  support:
    "Get help with Fraudly's website trust checker, scam checker results, phishing detection and online fraud protection—answers to common safety questions.",
  learn:
    "Guides on fake webshops, phishing links and website trust checks—practical online fraud protection tips from Fraudly's safe link checker education hub.",
  blog:
    "Fraudly blog: expert guides on fake webshops, PayPal phishing, scam website warning signs, and how to check if a website is safe—plus links to live trust checks.",
  intelligence:
    "Fraudly Intelligence: expert scam and website safety guides on fake webshops, PayPal phishing, warning signs, and trust checks—plus live public scan examples.",
  features:
    "Explore Fraudly scam checker tools: phishing detection, SSL review, fake webshop heuristics and website trust checks for everyday online fraud protection.",
  pulse:
    "Live fraud trends from Fraudly's scam checker—phishing detection spikes, fake webshop patterns and website trust check insights from community scans.",
  scamAlerts:
    "Public scam alerts with phishing context and fake webshop warnings—online fraud protection intelligence from Fraudly's threat monitoring team.",
  scamChecker:
    "Free online scam checker for suspicious websites and links—phishing detection, fake webshop signals and a website trust check before you click or pay.",
  phishingChecker:
    "Phishing detection for suspicious links with Fraudly's safe link checker—spot fake logins, credential theft and unsafe domains before you enter details.",
  fakeWebsiteChecker:
    "Fake webshop and copycat store checker—Fraudly's scam checker reviews unknown shops with website trust checks before you share payment information.",
  emailScamChecker:
    "Email scam checker and safe link checker for suspicious URLs—phishing detection context before you open invoices, alerts or too-good-to-be-true offers.",
  cryptoScamChecker:
    "Crypto scam checker with website trust check signals—phishing detection for suspicious coin sites. Informational only, not investment advice.",
  websiteScamChecker:
    "Free website scam checker—verify suspicious shops and links with Fraudly trust scores, phishing signals, and fake webshop patterns before you pay or log in.",
  checkIfWebsiteIsSafe:
    "Check if a website is safe with Fraudly—automated trust review, scam feeds, and reputation context for unfamiliar stores and login pages before you proceed.",
  fakeWebshopCheck:
    "Fake webshop check for dubious online stores—Fraudly reviews discount hype, policies, and trust signals so you can avoid copycat shops and payment fraud.",
  onlineScamDetector:
    "Online scam detector for URLs—Fraudly combines phishing detection, technical checks, and public trust data into one readable website risk snapshot.",
  privacy:
    "Privacy policy for Fraudly's scam checker and website trust check service—how we handle data, cookies and phishing detection logs for online fraud protection.",
  terms:
    "Terms for using Fraudly's scam checker, website trust checks and online fraud protection features—including subscriptions, limits and acceptable use.",
  cookies:
    "Cookie policy for Fraudly—necessary, analytics and marketing cookies when you use our scam checker, phishing detection and website trust check tools.",
  disclaimer:
    "Disclaimer for Fraudly scam checker and website trust check results—limits of phishing detection, third-party data and online fraud protection guidance.",
  scamHelp:
    "Scammed online? Find official reporting links for the Netherlands, UK, Germany, and the US—plus practical steps. Fraudly is informational, not law enforcement.",
  scamHelpCountry: (country: string) =>
    `What to do if you were scammed in ${country}: official reporting links, immediate steps, and how to check a website before you pay again.`,
  signIn:
    "Sign in to save website trust checks, scam checker history and phishing alerts—sync your Fraudly online fraud protection tools across devices securely.",
  signUp:
    "Create a free Fraudly account for more website trust checks, scam checker history and safe link checker access—online fraud protection for shoppers.",
  recentSearches:
    "Your private Fraudly scam checker and website trust check history—safe link checker results visible only when you are signed in to your account.",
  admin:
    "Fraudly administrator tools for internal operations—restricted access for staff; not indexed. Not part of public scam checker or trust check content.",
  adminScamAlerts:
    "Manage Fraudly scam alert publications and editorial review—admin-only workflow for phishing and fake webshop threat content, not publicly indexed.",
  scamAlertInvalidSlug:
    "This scam alert URL is not valid on Fraudly. Browse published phishing detection and scam checker threat alerts for online fraud protection context.",
  scamAlertNotFound:
    "This scam alert is unavailable on Fraudly. Browse other public phishing and fake webshop alerts for website trust check and fraud protection guidance.",
  scamAlertDetailFallback:
    "Published Fraudly scam alert with phishing detection notes, fake webshop context and website trust guidance—informational online fraud protection only.",
  scamAlertLoadError:
    "This scam alert could not be loaded. Browse other Fraudly phishing and scam checker alerts for safe link checker and trust check context online.",
  domainIntelFallback:
    "Website trust check for this domain—scam checker, phishing detection and fake webshop signals on Fraudly. Contextual online fraud protection, not a verdict."
} as const;

export function clampMetaDescription(description: string, max = SEO_DESCRIPTION_MAX): string {
  const trimmed = description.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max - 1).trimEnd();
  return slice.endsWith("…") ? slice : `${slice}…`;
}

/**
 * Build a check/scan result meta description for `/check/[domain]` (stays within SEO max).
 */
export function buildWebsiteCheckMetaDescription(
  domain: string,
  trustScore: number | null,
  summarySnippet?: string
): string {
  const host = domain.length > 40 ? `${domain.slice(0, 37)}…` : domain;
  let desc = `Website trust check for ${host}: Fraudly scam checker with phishing detection, fake webshop signals and safe link checker context.`;
  if (trustScore !== null) {
    desc += ` Trust-style score about ${trustScore}/100.`;
  } else {
    desc += " Trust score withheld when signals are inconclusive.";
  }
  const snippet = summarySnippet?.trim();
  if (snippet && desc.length < SEO_DESCRIPTION_TARGET_MIN) {
    const room = SEO_DESCRIPTION_MAX - desc.length - 1;
    if (room > 20) {
      desc += ` ${snippet.length > room ? `${snippet.slice(0, room - 1)}…` : snippet}`;
    }
  }
  return clampMetaDescription(desc);
}

/**
 * Build `/domain/[domain]` landing meta description (long-tail SEO).
 */
export function buildDomainIntelMetaDescription(
  hostname: string,
  trustScore: number | null
): string {
  const host = hostname.length > 36 ? `${hostname.slice(0, 33)}…` : hostname;
  let desc = `Is ${host} legit or a fake webshop? Fraudly scam checker with phishing detection, website trust check signals and online fraud protection context.`;
  if (trustScore !== null) {
    desc += ` Trust-style reading about ${trustScore}/100.`;
  }
  return clampMetaDescription(desc);
}

export function prepareMetaDescription(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  return clampMetaDescription(trimmed.length >= SEO_DESCRIPTION_MIN ? trimmed : fallback);
}

/** Development-only warnings for SEO description length. */
export function warnMetaDescriptionIfNeeded(route: string, description: string): void {
  if (process.env.NODE_ENV === "production") return;
  const len = description.length;
  if (len < SEO_DESCRIPTION_MIN) {
    console.warn(`[seo] ${route}: meta description too short (${len} chars, min ${SEO_DESCRIPTION_MIN})`);
  } else if (len > SEO_DESCRIPTION_MAX) {
    console.warn(`[seo] ${route}: meta description too long (${len} chars, max ${SEO_DESCRIPTION_MAX})`);
  } else if (len < SEO_DESCRIPTION_TARGET_MIN || len > SEO_DESCRIPTION_TARGET_MAX) {
    console.warn(
      `[seo] ${route}: meta description ${len} chars (target ${SEO_DESCRIPTION_TARGET_MIN}–${SEO_DESCRIPTION_TARGET_MAX})`
    );
  }
}

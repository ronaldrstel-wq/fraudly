import type { CoreDictionary } from "@/lib/i18n/dictionary-types";

/**
 * English static UI dictionary for marketing pages (scan results stay in EN_MESSAGES).
 */
export const en: CoreDictionary = {
  localeBanner: {
    dismiss: "Dismiss"
  },
  nav: {
    latestChecks: "Latest checks",
    pulse: "Fraudly Pulse",
    scamAlerts: "Scam alerts",
    howItWorks: "How it works",
    features: "Features",
    learn: "Learn",
    about: "About",
    scamHelp: "Scam help",
    support: "Support & FAQ"
  },
  auth: {
    login: "Log in",
    signUp: "Sign up"
  },
  footer: {
    tagline: "Fraudly helps you review suspicious links before you click.",
    features: "Features",
    support: "Support & FAQ",
    howItWorks: "How it works",
    learn: "Learn",
    scamChecker: "Scam checker",
    latestChecks: "Latest checks",
    pulse: "Fraudly Pulse",
    scamAlerts: "Scam alerts",
    scamHelp: "Scam help",
    privacy: "Privacy",
    terms: "Terms",
    disclaimer: "Disclaimer",
    cookies: "Cookie Policy",
    contact: "Contact"
  },
  homepage: {
    heroBadge: "Website & Shop Safety Check",
    heroTitleLine1: "See it.",
    heroTitleLine2: "Check it.",
    heroTitleLine3: "Trust it.",
    heroSubtitle: "Check if a website or webshop is safe before you buy.",
    heroTrustFeatures: [
      "Detect scams & phishing",
      "Analyze trust & reputation",
      "Check domain age & security",
      "AI-assisted risk analysis"
    ] as const,
    primaryCta: "Check website",
    secondaryCta: "How Fraudly Works",
    heroSearchHelper: "Fast. Private. Secure. No signup required for your first check.",
    trustHelperBelowSearch:
      "No installation required · Works instantly · Fraudly analyzes sites with public scam intelligence — not legal advice.",
    howItWorksTitle: "How Fraudly Works",
    howItWorksSteps: [
      { title: "Submit", body: "Paste a shop URL, domain, or suspicious link." },
      { title: "Analyze", body: "We check SSL, domain signals, reputation, and scam feeds." },
      { title: "AI Review", body: "Patterns are summarized in plain language." },
      { title: "Get Results", body: "See trust cues before you pay or sign in." }
    ] as const
  },
  about: {
    badge: "About Fraudly",
    title: "Helping people pause before risky clicks",
    intro:
      "Fraudly gives consumers a grounded second opinion on unfamiliar websites—before purchases, banking logins, or sharing personal details—using calm language and understandable signals.",
    independentBadge: "Independent Dutch project",
    independentTitle: "Independent project",
    independentP1:
      "Fraudly is an independent project created by Ronald, a Dutch technology professional and Service Manager with experience in AI, digital services, and building user-focused applications.",
    independentP2:
      "The project is built with a strong focus on usability, transparency, privacy, and helping people make safer decisions online.",
    whyTitle: "Why Fraudly exists",
    whyBody:
      "Online scams keep evolving—fake storefronts powered by slick ads, copycat banking portals, phishing DMs, and shady marketplaces. Most people simply need a trustworthy nudge plus enough detail to act wisely. Fraudly combines human-readable guidance with optional deep scan technology so curiosity does not mean clicking blind.",
    approachTitle: "How we approach trust",
    approachBody:
      "We fuse website trust signals with scam indicators, SSL posture, WHOIS clues, curated intelligence feeds, lightweight review probes, richer reputation enrichment when it succeeds, and AI-assisted narration. Nothing is perfect—coverage gaps happen—so every screen encourages independent verification before high-stakes actions.",
    pillars: [
      {
        title: "Built for skeptical shoppers",
        body: "We focus on phishing sites, bogus stores, and social ad scams—the places people lose money in minutes."
      },
      {
        title: "Signals you can inspect",
        body: "Every check cites the technical, reputation, and intelligence context we could reach so nothing feels like a black box."
      },
      {
        title: "Fast by design",
        body: "No installs or lengthy questionnaires—paste a URL, read the takeaway, optionally open deep scans when you want more proof."
      }
    ] as const,
    limitsTitle: "Honest limits",
    limitsBody:
      "Fraudly will never promise perfect accuracy—the web changes too quickly. Treat each result as situational awareness: combine it with issuer warnings, banking apps, retailer support chats, or people you trust in real life whenever the stakes are high.",
    ctaPrompt: "Have a questionable link?",
    ctaButton: "Run a Fraudly check"
  },
  support: {
    badge: "Support & FAQ",
    title: "How can we help?",
    intro:
      "Answers about website checks, trust scores, accounts, and reporting issues. Scan results and technical evidence stay in English for now.",
    emailCta: "Email support",
    quickHelpTitle: "Quick help topics",
    faqTitle: "Frequently asked questions",
    stillNeedHelp: "Still need help?",
    stillNeedHelpBody: "Email us with the URL you checked and what you expected—we read every message.",
    ctaCheck: "Check a website"
  },
  scamHelp: {
    badge: "Scam help — informational only",
    title: "Scammed or unsure what to do?",
    subtitle: "Find official places to report scams and practical steps to protect yourself.",
    cta: "Check a suspicious website",
    ctaSection: "Check a website before you pay",
    ctaButton: "Check a website before you pay",
    chooseCountry: "Choose your country",
    chooseCountryHint: "Select your country below to see official reporting organisations and practical next steps.",
    reportingForPrefix: "Reporting options for",
    privacyHint:
      "We use a privacy-friendly country signal from your browser or hosting provider. You can change this below.",
    detectedHint: "Suggested for your region based on a coarse country hint—not your precise location.",
    immediateActions: "Immediate actions",
    moreGuidancePrefix: "More detailed guidance for"
  },
  scamAlerts: {
    eyebrow: "Scam intelligence",
    title: "Scam & phishing alerts",
    intro:
      "Fraudly continuously monitors public scam intelligence and suspicious website signals to surface emerging threats in plain language.",
    chips: [
      "Recently detected threats",
      "Trending risky domains",
      "Phishing indicators",
      "New suspicious registrations"
    ] as const,
    chipHint: "Use filters to zoom in on phishing-style alerts, trending domains, and high-confidence summaries.",
    disclaimer:
      "Fraudly aggregates third-party intelligence. Treat every alert as encouragement to verify—not as proof by itself."
  },
  latestChecks: {
    overline: "Community snapshot · anonymized summaries",
    title: "Latest Fraud Checks",
    intro:
      "Recent public website checks run through Fraudly. This feed highlights sites people are actively verifying—shown without accounts or private history.",
    footnote:
      "Scores are generated automatically using trust, reputation where available, technical checks, scam intelligence feeds, and AI-assisted analysis—not a verdict on goodness or badness by itself.",
    resultsNote: "Individual check results remain in English."
  },
  meta: {
    home: {
      title: "Check if a Website or Webshop Is Safe | Fraudly",
      description:
        "Check if a website or online shop is safe with Fraudly. Webshop safety check, shop scam signals, and phishing detection before you buy."
    },
    about: {
      title: "About Fraudly — Website Trust & Scam Checker",
      description:
        "Learn how Fraudly's website trust check helps you avoid scams, phishing and fake webshops—online fraud protection through clear domain and store analysis."
    },
    support: {
      title: "Support & FAQ — Website Trust Checker Help",
      description:
        "Get help with Fraudly's website trust checker, scam checker results, phishing detection and online fraud protection—answers to common safety questions."
    },
    scamHelp: {
      title: "Scam Help — What to Do If You Were Scammed",
      description:
        "Scammed online? Find official reporting links and practical steps. Fraudly is informational, not law enforcement."
    },
    scamAlerts: {
      title: "Threat Alerts — Scam & Phishing Intelligence",
      description:
        "Public scam alerts with phishing context and fake webshop warnings—online fraud protection intelligence from Fraudly's threat monitoring team."
    },
    latestChecks: {
      title: "Latest Website Trust Checks",
      description:
        "View recent website trust checks and scam checker results from Fraudly—phishing detection and fake webshop signals in real-time public summaries."
    }
  }
};

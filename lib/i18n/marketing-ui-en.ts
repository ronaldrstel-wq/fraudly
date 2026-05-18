import type { MarketingUiExtension } from "@/lib/i18n/marketing-ui-types";

export const marketingUiEn: MarketingUiExtension = {
  common: { languageLabel: "Language" },
  scamAlertsPage: {
    filters: {
      allSeverities: "All severities",
      highRiskOnly: "High risk only",
      highRiskSub: "Uses aggregated alert score",
      malware: "Malware",
      phishing: "Phishing",
      severityTypeLabel: "Severity & type",
      exactTypeLabel: "Exact type:",
      anyType: "Any"
    },
    timeRange: {
      label: "Time range",
      today: "Today",
      todayHint: "Published since midnight UTC today",
      last24h: "Last 24h",
      last24hHint: "Rolling last 24 hours",
      last7d: "Last 7 days",
      last7dHint: "Rolling last seven days",
      allAlerts: "All alerts",
      allAlertsHint: "Every published alert in view",
      helper: "Default shows all published alerts in view. Narrow to Today (UTC) or shorter windows from the URL."
    },
    summary: {
      highScore: "High+ (score ≥ 75)",
      sortByScore: "Sorted by newest publication, then alert score",
      newTodayUtc: "Recently published (UTC)"
    },
    empty: {
      zeroTitle: "No active scam alerts right now",
      zeroBody:
        "Fraudly continuously checks public threat feeds and recent scans. New alerts will appear here when there is enough evidence to publish them.",
      filteredTitle: "No alerts match this view",
      filteredBody:
        "Try a wider time range (for example “All alerts”) or a different severity filter. Totals above still reflect all published alerts that are currently in view.",
      viewAllTimeCta: "View all published alerts",
      checkWebsiteCta: "Check a website now"
    },
    card: {
      technicalMatchStrength: "Match strength",
      technicalSignals: "Corroborating signals"
    },
    pagination: {
      prev: "Previous page",
      prevDisabled: "Previous",
      next: "Next page",
      nextDisabled: "Next",
      page: "Page"
    }
  },
  latestChecksPage: {
    trustScorePillLabel: "Trust Score",
    viewResultArrow: "View result →",
    emptyState:
      "No public checks published yet. As soon as privacy-safe summaries are available, they will appear here so you can see what others are looking up.",
    unavailableState: "Latest checks are temporarily unavailable. You can still check a website above.",
    ctaPrimary: "Run a website check",
    listAria: "Latest public fraud check summaries",
    entityFallback: "Checked item",
    entityLabels: {
      domain: "Domain / website",
      url: "URL",
      company: "Company / brand",
      crypto_wallet: "Crypto wallet",
      username: "Public username / handle"
    },
    pagination: {
      prev: "Previous page",
      prevDisabled: "Previous",
      next: "Next page",
      nextDisabled: "Next",
      page: "Page"
    }
  },
  homeSections: {
    trustActivity: {
      title: "Fraudly is helping users stay safer online",
      subtitle: "AI-assisted scans help identify suspicious websites, phishing attempts, and online scams.",
      footnote: "{count} public checks in the last 30 days — live from Fraudly’s privacy-safe feed.",
      stats: {
        websiteChecksLabel: "Website checks",
        websiteChecksHint: "Public checks in Fraudly’s latest feed.",
        websiteChecksFallback: "Growing",
        threatSignalsLabel: "Threat signals analyzed",
        threatSignalsHint: "Recent checks plus published scam alerts (last 30 days).",
        threatSignalsFallback: "Building",
        buildingHint: "Activity data is still building — check back soon.",
        aiLabel: "AI-assisted analysis",
        aiValue: "24/7",
        aiHint: "Always-on heuristics layered with public intelligence.",
        growingLabel: "Growing daily",
        growingValue: "New scans every day",
        growingValueActive: "Active today",
        growingHint: "Fresh public checks appear as people verify sites.",
        growingHintActive: "{count} public checks in the last 24 hours."
      }
    },
    whatWeCheck: {
      title: "What Fraudly analyzes",
      intro:
        "Fraudly combines trust signals, reputation data, and AI-assisted analysis to help detect suspicious websites.",
      cards: [
        { title: "Website reputation", body: "Public trust cues and review-style reputation signals when they are available—shown with clear limits." },
        { title: "SSL & security checks", body: "HTTPS availability, certificate context, and technical settings that matter for safe browsing." },
        { title: "Domain age & trust", body: "Registration timing and domain history cues that often differ between established and rushed scam sites." },
        { title: "Phishing indicators", body: "Language patterns, urgency tactics, and setup clues commonly seen on phishing and impersonation pages." },
        { title: "Scam reports", body: "Cross-checks against published scam alerts and public threat intelligence where matches exist." },
        { title: "AI risk patterns", body: "Heuristics that surface unusual combinations of signals—helpful when something feels off but is hard to name." }
      ]
    },
    featureCards: [
      { title: "Signals, not noise", description: "Reputation, scam feeds, SSL, domain story, and wording cues—rolled into one readable view." },
      { title: "Seconds, not guesswork", description: "Runs in the browser instantly. No install, no signup required for your first look." },
      { title: "Straight talk", description: "Plain-language guidance with honest limits—Fraudly augments your judgment; it doesn’t replace it." }
    ]
  },
  homeBelowFold: {
    trustSafety: {
      title: "Calm checks for real-life shopping moments",
      body: "Fraudly is a consumer website trust checker for social ads, marketplaces, impulse buys, and “is this URL safe?” seconds. You get structured signals—never shock-value scare copy.",
      bullets: [
        "Scam intelligence layered with reputation, SSL, and historical context",
        "Optional deep scans when you need richer technical + review insight",
        "Public “latest checks” plus threat alerts for wider awareness"
      ],
      featuresCta: "See features",
      learnCta: "Learn about online scams"
    },
    howItWorks: {
      title: "How the check works",
      steps: [
        "Paste a URL before you pay, log in, or tap a sketchy ad.",
        "Fraudly pulls security context, domain history, scam feeds, and reputation hints when they are reachable.",
        "You see a trust score, headline guidance, and expandable detail if you want receipts."
      ],
      footerPrefix: "Curious about the full pipeline? Read",
      footerLinkLabel: "how Fraudly works"
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          question: "Is Fraudly a scam website checker?",
          answer:
            "Yes—Fraudly is built so consumers can sanity-check unfamiliar links. Each run blends scam intelligence feeds, HTTPS and domain cues, lightweight review probes, richer reputation enrichment when it succeeds, and optional AI narration so you aren’t guessing alone."
        },
        {
          question: "Can Fraudly tell me if a website is 100% safe?",
          answer:
            "No automated tool can guarantee safety. Fraudly highlights trustworthy vs. risky indicators in one snapshot—use it alongside common sense and official verification before you spend money or reveal sensitive info."
        },
        {
          question: "How is this different from a basic virus scanner?",
          answer:
            "Fraudly focuses on misleading websites: phishing setups, dubious shops, sloppy SSL posture, shady wording, impersonation cues, curated threat feeds—not just downloadable malware."
        },
        {
          question: "How much does the first check cost?",
          answer: "Your first browser check stays free without an account. Sign up when you’re ready for more scans, alerts, history, or deep analysis credits."
        }
      ]
    },
    testimonials: {
      title: "What people say",
      items: [
        { quote: "Luckily I didn’t buy this product — Fraudly showed me it was a risky site.", name: "Emma" },
        { quote: "I now check every Instagram ad with Fraudly before ordering.", name: "Noah" },
        { quote: "Saved me from buying from a shady sneaker store.", name: "Jason" },
        { quote: "Within seconds I knew that TikTok shop needed a second look.", name: "Mila" },
        { quote: "The ad looked legit. Fraudly showed the red flags clearly.", name: "Olivia" },
        { quote: "Great for double-checking social promos before I buy.", name: "Daan" }
      ]
    },
    bottomCta: {
      title: "Ready to check a link?",
      bodyPrefix: "Run a free scan and share a calm snapshot like",
      bodyLinkLabel: "/check/example.com",
      bodySuffix: "when someone asks, “Does this site look OK?”",
      button: "Check website"
    }
  },
  supportFaq: [
    {
      question: "What is Fraudly?",
      answer:
        "Fraudly helps users analyze websites for possible scam signals, phishing risks, suspicious behavior, and trust indicators using automated intelligence and AI-assisted analysis."
    },
    {
      question: "Does Fraudly guarantee a website is safe?",
      answer:
        "No. Fraudly provides automated informational analysis based on available public and technical signals. Results are not guarantees and users should always use their own judgment."
    },
    {
      question: "How does the trust score work?",
      answer:
        "Fraudly combines multiple technical and reputation-based indicators to generate a trust score that helps users better understand potential online risks."
    },
    {
      question: "Can Fraudly detect phishing websites?",
      answer: "Fraudly helps identify suspicious patterns commonly associated with phishing, impersonation, and scam websites."
    },
    {
      question: "Why can scores change over time?",
      answer: "Website risks and reputation signals can change quickly. Fraudly continuously analyzes new information and public intelligence sources."
    },
    {
      question: "Is Fraudly free to use?",
      answer: "Fraudly currently offers free website safety checks with additional features planned for future releases."
    },
    {
      question: "Does Fraudly store my scans publicly?",
      answer:
        "Some scans may appear anonymously in public activity feeds to improve platform intelligence and transparency. No personal data is intentionally displayed publicly."
    },
    {
      question: "How can I contact support?",
      answer: "You can contact us anytime at support@fraudly.app."
    }
  ]
};

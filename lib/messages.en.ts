/**
 * Canonical English UI copy for Fraudly (single locale for production).
 * Future i18n: split per locale file and swap this export for the active locale.
 */
export const EN_MESSAGES = {
  /** Homepage / onboarding — second check gate (aligned with analytics event labels in docs). */
  freemium: {
    createFreeAccount: "Create free account",
    promptTitle: "Create a free account to check more websites",
    promptBody:
      "Your first website check is free and gives you the full breakdown. Want to check another website? Create a free account—or log in if you already have one.",
    afterResultBanner: "Want to check another website? Create a free account."
  },
  auth: {
    loginCta: "Log in",
    signUpCta: "Sign up",
    signOutCta: "Sign out",
    loginForFullAnalysis: "Log in to continue checking websites.",
    loginForAnotherCheck: "Your first free check is complete. Create a free account or log in to check another website.",
    loginForUrlCheck: "Log in to run a URL check.",
    loginForCheckout: "Log in to continue.",
    loginForAccount: "Log in to view your account."
  },
  home: {
    heroBadge: "Website & Shop Safety Check",
    /** Legacy full headline — homepage hero uses split headline in `Hero.tsx` for styling. */
    headline: "See it. Check it. Trust it.",
    subhead: "Check if a website or webshop is safe before you buy.",
    heroTrustFeatures: [
      "Detect scams & phishing",
      "Analyze trust & reputation",
      "Check domain age & security",
      "AI-assisted risk analysis"
    ] as const,
    /** Kept for any consumers expecting `trustBullets`; homepage uses `heroTrustFeatures`. */
    trustBullets: [
      "Detect scams & phishing",
      "Analyze trust & reputation",
      "Check domain age & security",
      "AI-assisted risk analysis"
    ] as const,
    primaryCta: "Check website",
    secondaryCta: "How Fraudly Works",
    secondaryCtaHref: "/how-it-works",
    heroSearchHelper: "Fast. Private. Secure. No signup required for your first check.",
    heroHowSteps: ["Submit", "Analyze", "AI Review", "Get Results"] as const,
    trustHelperBelowSearch:
      "No installation required · Works instantly · Fraudly analyzes sites with public scam intelligence — not legal advice.",
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
    whatWeCheckTitle: "What Fraudly analyzes",
    whatWeCheckIntro:
      "Fraudly combines trust signals, reputation data, and AI-assisted analysis to help detect suspicious websites.",
    whatWeCheckCards: [
      {
        title: "Website reputation",
        body: "Public trust cues and review-style reputation signals when they are available—shown with clear limits."
      },
      {
        title: "SSL & security checks",
        body: "HTTPS availability, certificate context, and technical settings that matter for safe browsing."
      },
      {
        title: "Domain age & trust",
        body: "Registration timing and domain history cues that often differ between established and rushed scam sites."
      },
      {
        title: "Phishing indicators",
        body: "Language patterns, urgency tactics, and setup clues commonly seen on phishing and impersonation pages."
      },
      {
        title: "Scam reports",
        body: "Cross-checks against published scam alerts and public threat intelligence where matches exist."
      },
      {
        title: "AI risk patterns",
        body: "Heuristics that surface unusual combinations of signals—helpful when something feels off but is hard to name."
      }
    ] as const,
  },
  reviewEvidence: {
    noPublicReviewProfile:
      "No public review profile was found. This limits confidence but does not prove the site is unsafe.",
    /** When third-party collectors fail (robots/HTTP/offline): never blame the merchant in UI copy. */
    reviewDataUnavailable: "Public review data unavailable for this check.",
    reviewInformationUnverified: "Review information could not be verified.",
    /** Public-intel bundle had scraping/crawler friction — concise, non-alarming. */
    reviewSnapshotIncomplete: "Some optional public-review snapshots were incomplete in this crawl; overall confidence may be lower."
  },
  scoring: {
    limitedPublicSources:
      "Some public data sources were unavailable or did not return enough information. This lowers how complete the picture is, but it is not direct evidence that the website is unsafe."
  },
  scanResult: {
    /** Friendly label for the compact line under the main recommendation (maps to trust tier / threat state). */
    technicalStatusHeading: "Signals behind your score",
    /** Plain-language summary bands (non-technical readers). */
    consumerSummary: {
      positive: "This website shows several positive trust indicators and no major scam signals in this scan.",
      mixed: "This website has mixed signals. It may still be legitimate, but take a closer look before you pay or sign in.",
      elevated: "This website shows several scam or phishing indicators.",
      underThreat:
        "Known scam or phishing reports flag this website. Treat it as high risk until you can verify through a channel you already trust."
    },
    consumerSummaryDisclaimer:
      "Online risks can change over time. Always use your own judgment before purchasing or sharing personal information.",
    /** Trust gauge (0 left → 100 right): axis captions aligned with trust score bands. */
    trustMeterAxis: {
      highRisk: "High risk",
      caution: "Some caution advised",
      looksSafe: "Looks safe"
    },
    detailedFindingsToggle: "Show technical details",
    detailedFindingsHint:
      "Redirects, list matches, certificates, reputation snapshots, and model notes — for when you want the full picture.",
    verdictMicroLabel: "Fraudly verdict",
    whyThisResultHeading: "Why this result?",
    whyThisResultIntro:
      "Fraudly combines website security checks, scam intelligence feeds, and public reputation signals into one trust score. The summary above reflects the strongest signals we found in this scan.",
    safetySignalsHeading: "Safety signals",
    safetySignalsIntro: "Key checks from this scan, explained in plain language.",
    reputationHeading: "Public reputation",
    reputationIntro:
      "Trustpilot and Google review signals are always checked. Only reliable matches with enough reviews can influence the trust score.",
    evidenceTierLabels: {
      confirmed_malicious: "Matches from scam intelligence",
      positive_trust: "Trust-positive signals",
      neutral_observation: "Website & technical observations",
      risk_indicator: "Detected risk patterns",
      missing_data: "Incomplete or unavailable data"
    } as const,
    resultSections: {
      confirmedIntelHeading: "Matches from scam intelligence",
      confirmedIntelHint: "Structured hits from curated phishing, malware, or police-aligned feeds in this crawl.",
      otherRiskHeading: "Detected risk patterns",
      otherRiskHint:
        "Extra risk-style signals scored in this snapshot. They are not definitive proof—a quick second opinion still helps.",
      trustNotesHeading: "Helpful signals & observations",
      trustNotesHint:
        "Facts and neutral checks that balance the picture. Missing a row usually means “not seen”, not proof either way.",
      domainBlockHeading: "Domain & registration",
      sslBlockHeading: "Security checks (HTTPS / certificates)",
      intelProvidersHeading: "Scam intelligence sources",
      intelProvidersHint: "Normalized provider output. “Matched” means that source reported something relevant in this run.",
      reputationBlockHeading: "Reputation enrichment",
      reputationBlockHint: "Optional broader reputation pass when available—beyond the quick baseline probes.",
      reputationChecking: "Checking reputation and security signals…",
      reputationUnavailable: "Reputation enrichment unavailable right now—your baseline scan findings still apply.",
      reputationEmptyHint: "No enriched reputation profile surfaced. That limits context; it does not prove the site is unsafe.",
      baselineReviewsHeading: "Quick review probes (baseline scan)",
      baselineReviewsHint: "Lightweight directory checks powering part of the model—hiccups here describe our snapshot, not the shop’s honesty.",
      supplyChainHeading: "Fulfillment signals",
      scoreDebugToggle: "Scoring detail (advanced)",
      scoreDebugTierHeading: "Scam intelligence weighting (model)",
      scoreDebugBaselineHeading: "Review collector notes (neutral)",
      scoreDebugCombinedHeading: "Combined scoring signals (reviews, reputation, feeds, fulfillment…)",
      aiFactorsHeading: "Key factors explained",
      aiFactorsHint:
        "Blended notes from patterns we detected, scam intelligence scoring, and optional AI assistance—not legal or financial advice.",
      optionalEvidenceHeading: "Optional context you added",
      optionalEvidenceBody:
        "Screenshots, ad notes, or social context are layered on top of the URL scan. They sharpen the story but never replace technical checks.",
      analyzedDomainHeading: "Website checked",
      trustScoreThreatNote:
        "Authoritative scam intelligence overrides the headline score so guidance stays cautious when feeds disagree with the numeric model."
    },
    /** Primary consumer headline — maps to trust/threat tier */
    humanRec: {
      glyphs: {
        positive: "✓",
        info: "ⓘ",
        warning: "⚠",
        critical: "⛔"
      },
      headlines: {
        trusted: "Looks safe",
        looksSafe: "No major risk indicators found",
        looksMostlySafe: "Looks mostly safe",
        notEnoughInfo: "Not Enough Information",
        beCareful: "Be careful",
        risky: "Risky",
        highRisk: "High risk detected",
        avoidWebsite: "Avoid This Website",
        dangerousWebsite: "Dangerous Website",
        invalidDomain: "Domain Not Verified",
        unreachable: "Site Unavailable"
      }
    },
    /** Single line under recommendation on compact overview cards (latest checks, recent searches) */
    overviewOneLine: {
      trusted: "No major risk indicators detected.",
      looksSafe: "No major phishing indicators detected.",
      looksMostlySafe: "Mostly positive snapshot — confirm limited checks if you plan to pay or sign in.",
      notEnoughInfo: "Limited public information available.",
      beCareful: "Some risk indicators were detected.",
      risky: "Elevated concern — verify through a channel you trust before checkout or logins.",
      highRisk: "Elevated risk in this snapshot.",
      avoidWebsite: "Strong risk indicators — verify independently before interacting.",
      dangerousWebsite: "Possible malware or harmful content.",
      invalidDomain: "Hostname could not be verified as a normal website.",
      unreachable: "No usable webpage was retrieved."
    },
    /** Short explanation under the human headline (browser-warning style) */
    shortExplain: {
      trusted: "No major risk indicators were detected.",
      looksSafe: "No major scam or phishing indicators were detected in this scan.",
      notEnoughInfo: "Some public reputation data was limited. This affects how much extra context we can show, but it is not a risk signal by itself.",
      notEnoughInfoLowCoverage:
        "Some public reputation data was limited. This affects how much extra context we can show, but it is not a risk signal by itself.",
      beCareful:
        "Some risk indicators were detected. Proceed carefully before entering personal or payment information.",
      highRisk: "Several strong risk signals were detected in this scan.",
      avoidPhishing: "This domain was flagged by phishing intelligence sources.",
      dangerousMalware: "This website may distribute malware or unsafe content.",
      avoidGeneric: "Authoritative sources flagged serious problems with this website.",
      confirmedMalicious: "At least one authoritative feed or reference flagged this host as malicious.",
      invalidDomain: "We could not verify this as a live, registered website hostname.",
      unreachable: "We could not load usable content from this address in this scan."
    },
    trustScoreExplainer:
      "The trust score combines technical checks, reputation signals where available, website history cues, scam intelligence, and AI-assisted analysis.",
    trustScoreExplainerFootnote:
      "Higher scores usually mean fewer red flags appeared in this snapshot—not proof a site is safe or unsafe.",
    trustScoreLabel: "Trust score",
    recommendationHeading: "Recommendation",
    whyHeading: "Why this result?",
    mainDetailHeading: "What we observed",
    signalReliability: "Source reliability",
    providerRowReliability: "reliability",
    enrichmentCompletenessLabel: "Public-source data completeness",
    footerDisclaimer:
      "Fraudly summarizes public scam intelligence, reputation snapshots, and technical signals for awareness. It is not legal, financial, or flawless security advice—verify important decisions yourself.",
    limitedStripTitle: "Limited public information available",
    limitedStripBody:
      "No confirmed malicious indicators were detected. Public data availability was limited in this scan, which affects context completeness but is not a risk signal.",
    /** Tier‑1 threat “why” lines */
    whyThreat: {
      phishingFeed: "This domain was identified in one or more phishing intelligence feeds.",
      malwareFeed: "This host appeared in malware or harmful-URL intelligence.",
      government: "A public police or government scam-warning source overlapped with this domain.",
      safeBrowsingPhishing: "Google Safe Browsing reported phishing or deceptive content for this URL.",
      safeBrowsingMalware: "Google Safe Browsing reported malware or harmful software linked to this URL.",
      intelDanger: "One or more intelligence sources reported a high-severity match for this host.",
      generic: "Authoritative threat intelligence reported a serious match for this website."
    },
    whyTrustBand: {
      trusted: "This website showed strong trust signals and no known phishing or malware list matches in this scan.",
      mostlySafe:
        "No major scam list matches appeared in this scan, though some automated checks were limited or worth a second look.",
      caution: "Some caution-style signals appeared—slow down before you trust links, logins, or checkout pages.",
      risky: "Multiple concerning patterns appeared in this snapshot compared with typical benign sites.",
      highRisk: "Several concerning signals accumulated in this scan relative to typical benign sites."
    },
    why: {
      nonexistent: "DNS and registration checks did not corroborate this hostname as a live, registered apex.",
      inactive: "The hostname may exist, but no usable website content was retrieved in this crawl.",
      confirmedMaliciousGeneric: "At least one authoritative feed or reference flagged this host as malicious."
    },
    recommendThreat: {
      phishing:
        "This website was flagged by phishing intelligence sources. Do not enter passwords, card numbers, or recovery codes.",
      malware: "Treat downloads and links as unsafe unless an independent security tool clears them.",
      government: "Treat this host as high risk until you can verify it through an official channel you opened yourself.",
      intelDanger: "Avoid interacting with this site unless a trusted security professional or vendor clears it.",
      generic: "Do not use this website for payments or sensitive data until the threat can be ruled out."
    },
    recommendTrustBand: {
      trusted: "No major risk indicators showed up in this scan—still use normal care with payments and personal data.",
      mostlySafe:
        "The snapshot looks broadly reassuring—if anything feels off, confirm the organisation through a channel you already trust.",
      caution: "Use caution before signing in, paying, or downloading. Prefer contacting the company through a known official route.",
      risky: "Pause before payments or account changes—verify the business and URL through an independent source you trust.",
      highRisk: "Avoid sharing personal or payment details until you can verify the site through a separate trusted source."
    },
    recommend: {
      nonexistent: "Do not treat this hostname as a trustworthy business until registration and DNS look correct from your side.",
      inactive: "If you expected a real store here, verify the URL with the brand through a channel you trust.",
      confirmedMalicious: "Do not trust this site for logins or payments unless independent corroboration contradicts the feeds."
    }
  },
  threatOverride: {
    bannerTitle: "Confirmed phishing intelligence detected",
    bannerBody:
      "This domain appeared in one or more public phishing or malware intelligence feeds. Avoid interacting with this website unless an official trusted source confirms it is safe.",
    /** When Safe Browsing or feeds indicate malware-distribution style threats */
    bannerTitleMalware: "Malware or harmful URL intelligence detected",
    confirmedPhishingRisk: "Confirmed phishing risk",
    malwareDetected: "Malware detected",
    confirmedMalicious: "Confirmed malicious"
  },
  check: {
    missingUrl: "Please enter a URL to check.",
    invalidWebsiteInput:
      "That doesn’t look like a website we can check. Enter a domain (like example.com), a full https link, or a path like example.com/login.",
    fullAnalysisLocked: "Log in to continue checking websites.",
    upsellPremium: "Create a free account to continue checking websites.",
    viewPremium: "Continue",
    urlFieldLabel: "Website, domain, or link",
    urlPlaceholder: "https://example.com",
    urlInputHelper: "Enter a website URL to analyze trust and scam indicators."
  },
  /** Live progress strip during `/api/check` (homepage scanner). */
  scanProgress: {
    phaseStart: "Analyzing trust and scam indicators…",
    phaseSecurity: "Checking reputation and security signals…",
    phaseSignals: "Gathering public reputation and scam intelligence…",
    phaseScoring: "Running AI-assisted website analysis…",
    phaseFinalizing: "Summarizing findings…",
    complete: "Analysis complete.",
    failedGeneric: "Website check couldn't finish. Please try again.",
    failedNetwork: "Could not reach the scanner. Check your connection and try again.",
    stoppedSignIn: "Sign-in required — check stopped.",
    stoppedLimit: "Check limit reached — upgrade or sign in.",
    stoppedInvalidResponse: "Unexpected response — check stopped."
  },
  rateLimit: {
    generic: "Too many checks right now. Please wait a bit and try again.",
    tooManyFromNetwork:
      "Too many checks are coming from this network in a short window. Please wait a few minutes and try again.",
    tooManyChecksShortWindow: "You’re checking websites a little too quickly. Please wait up to ten minutes and try again.",
    freeDailyExceeded:
      "You’ve reached today’s free check limit. Please try again tomorrow or upgrade for more checks.",
    paidDailyExceeded: "You’ve reached today’s plan check limit. Please try again tomorrow or contact support if you need more capacity.",
    deepDailyExceededFree:
      "You’ve reached today’s limit for full (deep) scans on a free account. Try again tomorrow or use a paid check for more deep analyses today."
  },
  checkout: {
    invalidResponse: "Unexpected server response.",
    checkoutFailed: "Checkout failed.",
    noCheckoutUrl: "No checkout page returned.",
    networkError: "Network error. Please check your connection.",
    unauthorized: "You must be logged in to continue.",
    invalidRequest: "Invalid request.",
    invalidPurchaseType: "Invalid purchase type.",
    genericFailure: "Checkout failed. Please try again later.",
    stripeNotConfigured: "Payments are not configured yet (Stripe).",
    missingAppUrl: "Server configuration is missing. Please contact support.",
    missingPriceId: "This product is temporarily unavailable.",
    invalidStripePriceId: "Stripe price ID is missing or invalid. Check your environment variables.",
    invalidReturnUrl: "Invalid return URL. Check NEXT_PUBLIC_APP_URL in Vercel.",
    temporarilyDisabled: "Creating a free account is currently the way to continue checking websites."
  },
  paywall: {
    titleNoFree: "Your free checks are used up",
    titleUnlock: "Unlock the full analysis",
    subtitleNoFree: "Buy individual checks or start Premium to keep viewing full analyses.",
    subtitleUnlock:
      "You are currently seeing only the basic result. Unlock full explanations, risk signals, and guidance before continuing.",
    unlockSingle: "Unlock for EUR 0.99",
    bundleFive: "5 checks for EUR 3.99",
    bundleTwenty: "20 checks for EUR 9.99",
    premiumMonthly: "Premium EUR 6.99/mo",
    working: "Working...",
    useCreditPremium: "Use credit / Premium",
    noCredits: "No credits available"
  },
  /** Full result — invalid / unregistered hostname banner (DNS + RDAP alignment). */
  domainInfrastructure: {
    domainStatusHeading: "Domain status",
    riskLevelHeading: "Risk level",
    reasonHeading: "Reason",
    notRegisteredLabel: "Not registered",
    highRiskInvalidLabel: "High Risk / Invalid",
    invalidHostExplanation:
      "This domain does not appear to exist or cannot be verified through DNS/RDAP systems. Scam and phishing campaigns often use disposable or malformed domains."
  },
  specialOutcomes: {
    nonexistent: {
      headline: "Domain does not exist",
      subline:
        "No active registered domain could be verified via public DNS/RDAP in this crawl. Phantom hosts should not be read as trustworthy.",
      reasonLine:
        "Fraudly did not run consumer-style trust grading because independent infrastructure checks did not corroborate a live registrable apex.",
      reviewSummary: "This hostname did not corroborate as a registered/resolvable apex in Fraudly's snapshot.",
      confidenceRationale: "We have high certainty that actionable website trust evidence is missing—not that the hostname is benign."
    },
    inactive: {
      headline: "Inactive or unreachable website",
      explain:
        "The domain appears to exist, but no active website could be reached in this crawl. This is common for parked names or dormant projects; it does not prove a scam.",
      crawlNote:
        "Fraudly only sees public fetch/TLS probes here—thin pages, redirects, or bot-blocking can look similar to downtime."
    }
  },
  siteOutcome: {
    statusHeading: "Threat status",
    scanCoverageHeading: "Public data availability",
    scanCoverageHelper:
      "This reflects how much public and technical data was available during the scan. Limited data availability is not a risk signal by itself.",
    scanCoverageHighLabel: "High — multiple checks returned usable context.",
    scanCoverageMediumLabel: "Moderate — some sources succeeded while others were limited.",
    scanCoverageLowLabel: "Limited public data available — this affects context depth, not direct risk.",
    /** @deprecated Use scanCoverage* labels in UI */
    confidenceHeading: "Public data availability",
    confidenceHelper:
      "This reflects how much public and technical data was available during the scan. Limited data availability is not a risk signal by itself.",
    confidenceHighLabel: "High — multiple checks returned usable context.",
    confidenceMediumLabel: "Moderate — some sources succeeded while others were limited.",
    confidenceLowLabel: "Limited public data available — this affects context depth, not direct risk.",
    trusted: "Trusted",
    unverified: "Strong snapshot",
    caution: "Some caution advised",
    highRisk: "High risk",
    confirmedMalicious: "Confirmed malicious",
    nonexistent: "Nonexistent domain",
    inactive: "Inactive / unreachable web",
    suppressedTrustMeter: "Trust score withheld — this hostname is not treated as an active website.",
    suppressedTrustExplanation:
      "Because no registered/resolvable apex was verified for consumer trust grading, Fraudly hides the trust score gauge for this hostname."
  },
  basicResult: {
    heading: "Basic result",
    intro: "This is the quick first assessment of the checked link.",
    recommendationHeading: "Recommendation",
    safeRecommendation: "No major risk indicators showed up in this quick scan—still verify payments and identities as usual.",
    suspiciousRecommendation:
      "Some risk signals were present. Prefer contacting the organization through a channel you already trust before paying or signing in.",
    highRiskRecommendation:
      "Treat this as elevated risk until you can verify the site through an independent, official channel.",
    checkedLink: "Checked link",
    riskStatus: "Risk status",
    safeLabel: "Looks safe",
    safeExplanation: "The basic scan did not highlight major fraud indicators.",
    suspiciousLabel: "Some caution advised",
    suspiciousExplanation: "Signals were found that merit extra caution.",
    highRiskLabel: "High risk",
    highRiskExplanation: "Multiple signals indicate an elevated fraud risk.",
    unlockHint: "Create a free account to continue checking more websites."
  },
  payment: {
    successTitle: "Payment received",
    successBody:
      "Your payment was processed. Credits or Premium access become active after the Stripe webhook is confirmed.",
    successCta: "Continue checking",
    cancelTitle: "Payment canceled",
    cancelBody: "No worries, you can restart checkout at any time.",
    cancelCta: "Back to pricing"
  },
  recentSearches: {
    navLabelShort: "Recent",
    navLabel: "Recent searches",
    pageTitle: "Recent searches",
    pageIntroPrivatelyStored: "Shown only on your account.",
    pageIntroAnonymous: "Stored privately for this browser. Sign in later to attach history to your account.",
    loading: "Loading your recent searches…",
    emptyState: "Your recent searches will appear here after you run a fraud check.",
    loadError: "Could not load your history. Refresh the page or try again.",
    reopenResult: "View result",
    reopenResultArrow: "View result →",
    deleteOne: "Delete",
    clearing: "Removing…",
    clearAll: "Clear all history",
    clearModalTitle: "Clear all search history?",
    clearModalBody:
      "This removes every recent fraud check snapshot from your private history here.",
    clearModalConfirm: "Yes, clear history",
    clearModalCancel: "Cancel",
    needSession:
      "We could not confirm this browser’s private session cookie. Refresh the page and try again, or log in.",
    invalidClearConfirm: "Confirmation mismatch. Close the dialog and try again.",
    entityLabels: {
      domain: "Domain",
      url: "URL",
      email: "Email",
      phone: "Phone"
    },
    columns: {
      query: "Searched",
      entity: "Entity type",
      score: "Trust score",
      status: "Guidance",
      searchedAt: "Searched at",
      action: "Open"
    },
    verdictLabels: {
      safe: "lower risk snapshot",
      suspicious: "mixed signals • caution",
      scam: "high-risk snapshot"
    }
  },
  scamAlertsUi: {
    summaryHighScore: "High+ (score ≥ 75)",
    sortByScore: "Sorted by newest publication, then alert score",
    filterHighSub: "Uses aggregated alert score",
    technicalMatchStrength: "Match strength",
    technicalSignals: "Corroborating signals",
    pageEyebrow: "Scam intelligence",
    overviewIntro:
      "Fraudly continuously monitors public scam intelligence and suspicious website signals to surface emerging threats in plain language.",
    explainChipRecentlyDetected: "Recently detected threats",
    explainChipTrendingDomains: "Trending risky domains",
    explainChipPhishing: "Phishing indicators",
    explainChipSuspiciousDomains: "New suspicious registrations",
    chipHint: "Use filters to zoom in on phishing-style alerts, trending domains, and high-confidence summaries.",
    summaryNewTodayUtc: "Recently published (UTC)",
    emptyStateZeroTitle: "No active scam alerts right now",
    emptyStateZeroBody:
      "Fraudly continuously checks public threat feeds and recent scans. New alerts will appear here when there is enough evidence to publish them.",
    emptyStateFilteredTitle: "No alerts match this view",
    emptyStateFilteredBody:
      "Try a wider time range (for example “All alerts”) or a different severity filter. Totals above still reflect all published alerts that are currently in view.",
    emptyStateViewAllTimeCta: "View all published alerts",
    emptyStateCheckWebsiteCta: "Check a website now"
  },
  latestChecks: {
    navLabel: "Latest checks",
    navLabelShort: "Latest",
    overline: "Community snapshot · anonymized summaries",
    pageTitle: "Latest Fraud Checks",
    intro:
      "Recent public website checks run through Fraudly. This feed highlights sites people are actively verifying—shown without accounts or private history.",
    scoreExplainerFootnote:
      "Scores are generated automatically using trust, reputation where available, technical checks, scam intelligence feeds, and AI-assisted analysis—not a verdict on goodness or badness by itself.",
    emptyState:
      "No public checks published yet. As soon as privacy-safe summaries are available, they will appear here so you can see what others are looking up.",
    unavailableState:
      "Latest checks are temporarily unavailable. You can still check a website above.",
    ctaPrimary: "Run a website check",
    listAria: "Latest public fraud check summaries",
    riskHint: "risk-style score",
    viewSnapshot: "View public result",
    /** Compact feed rows (latest checks · discovery list) */
    viewResultArrow: "View result →",
    labels: {
      risk: "Trust score",
      status: "Status label",
      assessmentNote: "Fraudly trust assessment (same model as full results)"
    },
    entityLabels: {
      domain: "Domain / website",
      url: "URL",
      company: "Company / brand",
      crypto_wallet: "Crypto wallet",
      username: "Public username / handle"
    },
    entityFallback: "Checked item",
    paginationPrev: "Previous page",
    paginationPrevDisabled: "Previous",
    paginationNext: "Next page",
    paginationNextDisabled: "Next",
    paginationPage: "Page"
  }
} as const;


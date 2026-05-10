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
    loginForFullAnalysis: "Log in to continue checking websites.",
    loginForAnotherCheck: "Your first free check is complete. Create a free account or log in to check another website.",
    loginForUrlCheck: "Log in to run a URL check.",
    loginForCheckout: "Log in to continue.",
    loginForAccount: "Log in to view your account."
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
    technicalStatusHeading: "Technical status",
    /** Primary consumer headline — maps to trust/threat tier */
    humanRec: {
      glyphs: {
        positive: "✓",
        info: "ⓘ",
        warning: "⚠",
        critical: "⛔"
      },
      headlines: {
        trusted: "Trusted",
        looksSafe: "Looks Safe",
        notEnoughInfo: "Not Enough Information",
        beCareful: "Be Careful",
        highRisk: "High Risk",
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
      notEnoughInfo: "Limited public information available.",
      beCareful: "Some risk indicators were detected.",
      highRisk: "Elevated risk in this snapshot.",
      avoidWebsite: "Strong risk indicators — verify independently before interacting.",
      dangerousWebsite: "Possible malware or harmful content.",
      invalidDomain: "Hostname could not be verified as a normal website.",
      unreachable: "No usable webpage was retrieved."
    },
    /** Short explanation under the human headline (browser-warning style) */
    shortExplain: {
      trusted: "No major risk indicators were detected.",
      looksSafe: "This website appears legitimate based on available signals.",
      notEnoughInfo: "We could not find enough public information to confidently assess this website.",
      notEnoughInfoLowCoverage:
        "We could not find enough public information to confidently assess this website. Low scan coverage does not automatically mean the site is unsafe.",
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
    trustScoreExplainer: "Higher means fewer risk-style signals in this scan—not a guarantee of safety.",
    trustScoreLabel: "Trust score",
    recommendationHeading: "Recommendation",
    whyHeading: "Why this result?",
    mainDetailHeading: "What we observed",
    signalReliability: "Source reliability",
    providerRowReliability: "reliability",
    enrichmentCompletenessLabel: "Public-source data completeness",
    footerDisclaimer:
      "Fraudly summarizes public and technical signals for awareness. It is not legal, financial, or infallible security advice—always verify before payments or sensitive actions.",
    limitedStripTitle: "Limited public information available",
    limitedStripBody:
      "No confirmed malicious indicators were detected, but public scan coverage was limited. Low coverage does not automatically mean a website is unsafe.",
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
      likelyLegit:
        "Available signals look broadly legitimate, and we did not see a confirmed malicious list match.",
      limitedPublicData:
        "This website did not show confirmed malicious indicators, but only limited public information was available to score it.",
      suspicious: "Some risk-style signals were present—extra care is warranted before you trust or pay.",
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
      likelyLegit: "This website appears broadly legitimate from available signals—verify the organisation if anything feels off.",
      limitedPublicData:
        "Not enough public information was available to score this site confidently—double-check the business through independent channels.",
      suspicious: "Use caution before signing in, paying, or downloading. Prefer contacting the company through a known official route.",
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
    urlPlaceholder: "https://example.com"
  },
  /** Live progress strip during `/api/check` (homepage scanner). */
  scanProgress: {
    phaseStart: "Starting website check...",
    phaseSecurity: "Running security checks on the URL...",
    phaseSignals: "Gathering public signals...",
    phaseScoring: "Scoring trust and risk signals...",
    phaseFinalizing: "Finalizing analysis...",
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
    scanCoverageHeading: "Scan coverage",
    scanCoverageHelper:
      "This reflects how much public and technical data was available during the scan. Low scan coverage does not automatically mean a website is unsafe.",
    scanCoverageHighLabel: "High — multiple checks returned usable data.",
    scanCoverageMediumLabel: "Medium — some sources succeeded; others were missing or inconclusive.",
    scanCoverageLowLabel: "Low — limited public data. That only limits how complete the picture is.",
    /** @deprecated Use scanCoverage* labels in UI */
    confidenceHeading: "Scan coverage",
    confidenceHelper:
      "This reflects how much public and technical data was available during the scan. Low coverage does not automatically mean a website is unsafe.",
    confidenceHighLabel: "High — multiple checks returned usable data.",
    confidenceMediumLabel: "Medium — some sources succeeded; others were missing or inconclusive.",
    confidenceLowLabel: "Low — limited public data. That only limits how complete the picture is.",
    trusted: "Trusted",
    unverified: "Strong snapshot",
    caution: "Further review suggested",
    highRisk: "High risk",
    confirmedMalicious: "Confirmed malicious",
    nonexistent: "Nonexistent domain",
    inactive: "Inactive / unreachable web",
    suppressedTrustMeter: "Trust score withheld — this hostname is not treated as an active website.",
    suppressedTrustExplanation:
      "Because no registered/resolvable apex was verified for consumer trust grading, Fraudly hides the Trusted/Caution gauges for this hostname."
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
    safeLabel: "Safe",
    safeExplanation: "The basic scan did not find direct fraud indicators.",
    suspiciousLabel: "Possibly suspicious",
    suspiciousExplanation: "Signals were found that require extra caution.",
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
      suspicious: "mixed signals",
      scam: "strong risk snapshot"
    }
  },
  scamAlertsUi: {
    summaryHighScore: "High+ (score ≥ 75)",
    sortByScore: "Sorted by newest publication, then alert score",
    filterHighSub: "Uses aggregated alert score",
    technicalMatchStrength: "Match strength",
    technicalSignals: "Corroborating signals"
  },
  latestChecks: {
    navLabel: "Latest checks",
    navLabelShort: "Latest",
    overline: "Public discovery · anonymized summaries",
    pageTitle: "Latest Fraud Checks",
    intro:
      "Showing recent public checks that cleared our privacy filter—no accounts, IPs, or private search history. Higher trust scores mean fewer risk-style signals in that snapshot (not a guarantee). We exclude uncertain items from this list.",
    emptyState: "No public fraud checks yet. Recent public-safe checks will appear here.",
    ctaPrimary: "Run a website check",
    listAria: "Latest public fraud check summaries",
    riskHint: "risk-style score",
    viewSnapshot: "View public result",
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


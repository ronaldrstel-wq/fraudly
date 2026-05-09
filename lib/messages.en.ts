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
    statusHeading: "Site status",
    confidenceHeading: "Rating confidence",
    confidenceHighLabel: "High — multiple independent stewardship or reputation checks aligned.",
    confidenceMediumLabel: "Medium — some checks succeeded, others were inconclusive.",
    confidenceLowLabel: "Low — limited observable evidence; Fraudly avoids strong conclusions.",
    trusted: "Trusted",
    unverified: "Unverified",
    caution: "Caution",
    highRisk: "High risk",
    confirmedMalicious: "Confirmed malicious signal",
    nonexistent: "Nonexistent domain",
    inactive: "Inactive / unreachable web",
    suppressedTrustMeter: "Trust score withheld — this hostname is not treated as an active website.",
    suppressedTrustExplanation:
      "Because no registered/resolvable apex was verified for consumer trust grading, Fraudly hides the Trusted/Caution gauges for this hostname."
  },
  basicResult: {
    heading: "Basic result",
    intro: "This is the quick first assessment of the checked link.",
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
      score: "Trust-style score",
      status: "Status",
      searchedAt: "Searched at",
      action: "Open"
    },
    verdictLabels: {
      safe: "lower risk snapshot",
      suspicious: "mixed signals",
      scam: "strong risk snapshot"
    }
  },
  latestChecks: {
    navLabel: "Latest checks",
    navLabelShort: "Latest",
    overline: "Public discovery · anonymized summaries",
    pageTitle: "Latest Fraud Checks",
    intro:
      "Showing the last 10 publicly visible checks that cleared our privacy filter—no accounts, IPs, or private search history. Stronger scores mean more risk-style signals in that snapshot. When in doubt, we exclude items from this list.",
    emptyState: "No public fraud checks yet. Recent public-safe checks will appear here.",
    ctaPrimary: "Run a website check",
    listAria: "Latest public fraud check summaries",
    riskHint: "risk-style score",
    viewSnapshot: "View public result",
    labels: {
      risk: "Risk score",
      status: "Status label"
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


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
  check: {
    missingUrl: "Please enter a URL to check.",
    fullAnalysisLocked: "Log in to continue checking websites.",
    upsellPremium: "Create a free account to continue checking websites.",
    viewPremium: "Continue"
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
  }
} as const;


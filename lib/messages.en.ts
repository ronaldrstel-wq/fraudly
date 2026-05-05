export const EN_MESSAGES = {
  auth: {
    loginCta: "Log in",
    signUpCta: "Sign up",
    loginForFullAnalysis: "Log in to use the full analysis.",
    loginForAnotherCheck: "Your free check has been used. Log in to run another check.",
    loginForUrlCheck: "Log in to run a URL check.",
    loginForCheckout: "Log in to continue to checkout.",
    loginForAccount: "Log in to view your account."
  },
  check: {
    missingUrl: "Please enter a URL to check.",
    fullAnalysisLocked: "No credits available for full analysis. Buy checks or start Premium.",
    upsellPremium:
      "You have already run several checks. Premium gives you lower cost checks with less friction.",
    viewPremium: "View Premium"
  },
  checkout: {
    invalidResponse: "Unexpected server response.",
    checkoutFailed: "Checkout failed.",
    noCheckoutUrl: "No checkout page returned.",
    networkError: "Network error. Please check your connection.",
    unauthorized: "You must be logged in to continue to checkout.",
    invalidRequest: "Invalid request.",
    invalidPurchaseType: "Invalid purchase type.",
    genericFailure: "Checkout failed. Please try again later.",
    stripeNotConfigured: "Payments are not configured yet (Stripe).",
    missingAppUrl: "Server configuration is missing. Please contact support.",
    missingPriceId: "This product is temporarily unavailable.",
    invalidStripePriceId: "Stripe price ID is missing or invalid. Check your environment variables.",
    invalidReturnUrl: "Invalid return URL. Check NEXT_PUBLIC_APP_URL in Vercel."
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
    unlockHint: "Unlock the full analysis for complete details, risk signals, and next-step advice."
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


import type { MarketingUiExtension } from "@/lib/i18n/marketing-ui-types";

export type CoreDictionary = {
  localeBanner: {
    dismiss: string;
  };
  nav: {
    latestChecks: string;
    pulse: string;
    scamAlerts: string;
    howItWorks: string;
    features: string;
    learn: string;
    about: string;
    scamHelp: string;
    support: string;
  };
  auth: {
    login: string;
    signUp: string;
  };
  footer: {
    tagline: string;
    features: string;
    support: string;
    howItWorks: string;
    learn: string;
    scamChecker: string;
    websiteScamChecker: string;
    checkIfWebsiteIsSafe: string;
    fakeWebshopCheck: string;
    onlineScamDetector: string;
    latestChecks: string;
    pulse: string;
    scamAlerts: string;
    scamHelp: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    cookies: string;
    contact: string;
  };
  homepage: {
    heroBadge: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroTitleLine3: string;
    heroSubtitle: string;
    heroTrustFeatures: readonly string[];
    primaryCta: string;
    secondaryCta: string;
    heroSearchHelper: string;
    trustHelperBelowSearch: string;
    howItWorksTitle: string;
    howItWorksSteps: readonly { title: string; body: string }[];
  };
  about: {
    badge: string;
    title: string;
    intro: string;
    independentBadge: string;
    independentTitle: string;
    independentP1: string;
    independentP2: string;
    whyTitle: string;
    whyBody: string;
    approachTitle: string;
    approachBody: string;
    pillars: readonly { title: string; body: string }[];
    limitsTitle: string;
    limitsBody: string;
    ctaPrompt: string;
    ctaButton: string;
  };
  support: {
    badge: string;
    title: string;
    intro: string;
    emailCta: string;
    quickHelpTitle: string;
    faqTitle: string;
    stillNeedHelp: string;
    stillNeedHelpBody: string;
    ctaCheck: string;
  };
  scamHelp: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
    ctaSection: string;
    ctaButton: string;
    chooseCountry: string;
    chooseCountryHint: string;
    reportingForPrefix: string;
    privacyHint: string;
    detectedHint: string;
    immediateActions: string;
    moreGuidancePrefix: string;
  };
  scamAlerts: {
    eyebrow: string;
    title: string;
    intro: string;
    chips: readonly string[];
    chipHint: string;
    disclaimer: string;
  };
  latestChecks: {
    overline: string;
    title: string;
    intro: string;
    footnote: string;
    resultsNote: string;
  };
  meta: {
    home: { title: string; description: string };
    about: { title: string; description: string };
    support: { title: string; description: string };
    scamHelp: { title: string; description: string };
    scamAlerts: { title: string; description: string };
    latestChecks: { title: string; description: string };
  };
};

export type Dictionary = CoreDictionary & MarketingUiExtension;

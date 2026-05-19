import type { CheckFlowMessages } from "@/lib/i18n/check-flow";
import type { ResultFlowMessages } from "@/lib/i18n/result-flow";

/** Extended marketing UI strings merged into each locale dictionary. */
export type MarketingUiExtension = {
  checkFlow: CheckFlowMessages;
  resultFlow: ResultFlowMessages;
  common: {
    languageLabel: string;
  };
  scamAlertsPage: {
    filters: {
      allSeverities: string;
      highRiskOnly: string;
      highRiskSub: string;
      malware: string;
      phishing: string;
      severityTypeLabel: string;
      exactTypeLabel: string;
      anyType: string;
    };
    timeRange: {
      label: string;
      today: string;
      todayHint: string;
      last24h: string;
      last24hHint: string;
      last7d: string;
      last7dHint: string;
      allAlerts: string;
      allAlertsHint: string;
      helper: string;
    };
    summary: {
      highScore: string;
      sortByScore: string;
      newTodayUtc: string;
      totalPublished: string;
      mostCommonType: string;
      showing: string;
      zeroPublished: string;
      rangeSingle: string;
      rangeSpan: string;
    };
    empty: {
      zeroTitle: string;
      zeroBody: string;
      filteredTitle: string;
      filteredBody: string;
      viewAllTimeCta: string;
      checkWebsiteCta: string;
    };
    card: {
      technicalMatchStrength: string;
      technicalSignals: string;
      relatedAlertSameDomain: string;
      published: string;
      updated: string;
      source: string;
      unknown: string;
      domainSr: string;
      severitySr: string;
      technicalDetails: string;
      readFullAlert: string;
      publishedExact: string;
      rawType: string;
      originalTitle: string;
      domain: string;
      url: string;
    };
    pagination: {
      prev: string;
      prevDisabled: string;
      next: string;
      nextDisabled: string;
      page: string;
    };
  };
  latestChecksPage: {
    trustScorePillLabel: string;
    trustScoreOutOf100Aria: string;
    dataConfidenceAria: string;
    viewResultArrow: string;
    emptyState: string;
    unavailableState: string;
    ctaPrimary: string;
    listAria: string;
    entityFallback: string;
    entityLabels: {
      domain: string;
      url: string;
      company: string;
      crypto_wallet: string;
      username: string;
    };
    pagination: {
      prev: string;
      prevDisabled: string;
      next: string;
      nextDisabled: string;
      page: string;
    };
  };
  homeSections: {
    trustActivity: {
      title: string;
      subtitle: string;
      footnote: string;
      stats: {
        websiteChecksLabel: string;
        websiteChecksHint: string;
        websiteChecksFallback: string;
        threatSignalsLabel: string;
        threatSignalsHint: string;
        threatSignalsFallback: string;
        buildingHint: string;
        aiLabel: string;
        aiValue: string;
        aiHint: string;
        growingLabel: string;
        growingValue: string;
        growingValueActive: string;
        growingHint: string;
        growingHintActive: string;
      };
    };
    whatWeCheck: {
      title: string;
      intro: string;
      cards: readonly { title: string; body: string }[];
    };
    featureCards: readonly { title: string; description: string }[];
  };
  homeBelowFold: {
    trustSafety: {
      title: string;
      body: string;
      bullets: readonly string[];
      featuresCta: string;
      learnCta: string;
    };
    howItWorks: {
      title: string;
      steps: readonly string[];
      footerPrefix: string;
      footerLinkLabel: string;
    };
    faq: {
      title: string;
      items: readonly { question: string; answer: string }[];
    };
    testimonials: {
      title: string;
      items: readonly { quote: string; name: string }[];
    };
    bottomCta: {
      title: string;
      bodyPrefix: string;
      bodyLinkLabel: string;
      bodySuffix: string;
      button: string;
    };
  };
  supportFaq: readonly { question: string; answer: string }[];
  recentSearchesUi: import("@/lib/i18n/recent-searches-ui").RecentSearchesUiMessages;
};

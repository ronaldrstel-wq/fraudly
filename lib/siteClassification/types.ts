export type SiteType =
  | "webshop"
  | "company_website"
  | "saas_landing"
  | "blog_content"
  | "portfolio_personal"
  | "login_portal"
  | "unknown";

export type SiteClassificationConfidence = "low" | "medium" | "high";

export type WebshopSurfaceSignals = {
  hasCartCheckout: boolean;
  hasProductCatalog: boolean;
  hasShippingReturns: boolean;
  hasPaymentMentions: boolean;
  discountHeavy: boolean;
  platformTrace: string | null;
  missingContactOrPolicies: boolean;
};

export type SiteClassification = {
  siteType: SiteType;
  confidence: SiteClassificationConfidence;
  /** True when ecommerce / payment-collection patterns dominate. */
  isWebshop: boolean;
  indicators: string[];
  webshop: WebshopSurfaceSignals;
};

export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export type SiteRiskDimensions = {
  siteType: SiteType;
  scamRiskLevel: RiskLevel;
  shoppingRiskLevel: RiskLevel;
  reputationRiskLevel: RiskLevel;
  customerExperienceWarning: string | null;
  limitedHistoryWarning: string | null;
};

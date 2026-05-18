import type { SiteClassification, SiteClassificationConfidence, SiteType, WebshopSurfaceSignals } from "@/lib/siteClassification/types";

export type ClassifySiteTypeInput = {
  url?: string;
  hostname?: string;
  pageText?: string;
  htmlSnippet?: string;
};

const ECOMMERCE_PLATFORMS =
  /\b(shopify|woocommerce|magento|lightspeed|shopware|prestashop|bigcommerce|wix\s+ecommerce|squarespace\s+commerce)\b/i;

const CART_CHECKOUT =
  /\b(add to cart|add-to-cart|shopping cart|shopping basket|view cart|checkout|basket|winkelwagen|in winkelwagen|afrekenen|bestellen)\b/i;
const PRODUCT_CATALOG = /\b(products?|shop now|buy now|our collection|catalogue|catalog|sku|in stock|out of stock)\b/i;
const PRICE_CURRENCY = /(?:[$€£]\s?\d{1,4}|\d{1,4}\s?(?:usd|eur|gbp|euro))/i;
const SHIPPING_RETURNS =
  /\b(shipping|delivery|returns?|refund|money[- ]back|track(?:ing)?\s+order|verzending|retour|levering)\b/i;
const PAYMENT =
  /\b(visa|mastercard|paypal|ideal|apple pay|google pay|klarna|afterpay|bancontact|payment method|pay with)\b/i;
const DISCOUNT =
  /(?:7\d|8\d|9\d)\s*%|\b(?:70|80|90)\s*%\s*(?:off|korting|discount|sale)|\b(clearance|mega sale|flash sale|coupon|promo code)\b/i;

const SAAS =
  /\b(free trial|sign up|signup|get started|pricing plans?|per month|saas|api docs|download (?:the )?app|dashboard|platform)\b/i;
const COMPANY =
  /\b(about us|our team|careers|investors|enterprise|corporate|who we are|over ons|vacatures)\b/i;
const BLOG = /\b(blog|article|read more|published on|categories|newsletter|editorial)\b/i;
const PORTFOLIO = /\b(portfolio|my work|resume|curriculum vitae|\bcv\b|freelance designer|photography)\b/i;
const LOGIN = /\b(sign in|log in|login|account portal|authenticate|two-factor|password reset)\b/i;

function scorePatterns(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const p of patterns) {
    if (p.test(text)) n += 1;
  }
  return n;
}

function inferWebshopSignals(text: string, html: string): WebshopSurfaceSignals {
  const blob = `${text}\n${html}`;
  const hasCartCheckout = CART_CHECKOUT.test(blob);
  const hasProductCatalog = PRODUCT_CATALOG.test(blob) || PRICE_CURRENCY.test(blob);
  const hasShippingReturns = SHIPPING_RETURNS.test(blob);
  const hasPaymentMentions = PAYMENT.test(blob);
  const discountHeavy = DISCOUNT.test(blob);
  const platformMatch = blob.match(ECOMMERCE_PLATFORMS);
  const hasContact = /\b(contact us|customer service|support@|help@|get in touch)\b/i.test(blob);
  const hasPolicies = hasShippingReturns || /\b(privacy policy|terms of service|terms and conditions)\b/i.test(blob);
  const missingContactOrPolicies = !hasContact && !hasPolicies;

  return {
    hasCartCheckout,
    hasProductCatalog,
    hasShippingReturns,
    hasPaymentMentions,
    discountHeavy,
    platformTrace: platformMatch ? platformMatch[0].toLowerCase() : null,
    missingContactOrPolicies
  };
}

function pickSiteType(scores: Record<SiteType, number>): { siteType: SiteType; confidence: SiteClassificationConfidence } {
  const ranked = (Object.entries(scores) as [SiteType, number][]).sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (!top || top[1] <= 0) return { siteType: "unknown", confidence: "low" };
  const margin = top[1] - (second?.[1] ?? 0);
  const confidence: SiteClassificationConfidence =
    top[1] >= 4 && margin >= 2 ? "high" : top[1] >= 2 && margin >= 1 ? "medium" : "low";
  return { siteType: top[0], confidence };
}

/**
 * Lightweight page classifier for scoring — not a full industry taxonomy.
 */
export function classifySiteType(input: ClassifySiteTypeInput): SiteClassification {
  const text = (input.pageText ?? "").trim();
  const html = (input.htmlSnippet ?? "").trim();
  const combined = `${text}\n${html}`.slice(0, 120_000);
  const host = (input.hostname ?? "").toLowerCase();

  const webshop = inferWebshopSignals(text, html);
  const indicators: string[] = [];

  const scores: Record<SiteType, number> = {
    webshop: 0,
    company_website: 0,
    saas_landing: 0,
    blog_content: 0,
    portfolio_personal: 0,
    login_portal: 0,
    unknown: 0
  };

  if (webshop.hasCartCheckout) {
    scores.webshop += 3;
    indicators.push("cart_or_checkout");
  }
  if (webshop.hasProductCatalog) {
    scores.webshop += 2;
    indicators.push("product_catalog");
  }
  if (webshop.hasShippingReturns) {
    scores.webshop += 2;
    indicators.push("shipping_returns");
  }
  if (webshop.hasPaymentMentions) {
    scores.webshop += 2;
    indicators.push("payment_methods");
  }
  if (webshop.discountHeavy) {
    scores.webshop += 1;
    indicators.push("discount_language");
  }
  if (webshop.platformTrace) {
    scores.webshop += 3;
    indicators.push(`platform:${webshop.platformTrace}`);
  }
  if (/\b(shop|store|boutique|outlet|kopen|winkel)\b/i.test(host) || /\b(shop|store)\b/i.test(combined.slice(0, 2000))) {
    scores.webshop += 1;
    indicators.push("shop_naming");
  }

  scores.saas_landing += scorePatterns(combined, [SAAS]);
  scores.company_website += scorePatterns(combined, [COMPANY]);
  scores.blog_content += scorePatterns(combined, [BLOG]);
  scores.portfolio_personal += scorePatterns(combined, [PORTFOLIO]);
  scores.login_portal += scorePatterns(combined, [LOGIN]);

  if (scores.saas_landing >= 2 && scores.webshop < 3) indicators.push("saas_patterns");
  if (scores.company_website >= 1 && scores.webshop < 2) indicators.push("company_patterns");

  const webshopScore = scores.webshop;
  const isWebshop =
    webshopScore >= 3 ||
    (webshop.hasCartCheckout && webshop.hasPaymentMentions) ||
    (webshop.platformTrace != null && webshop.hasProductCatalog);

  if (isWebshop) {
    scores.webshop += 2;
  }

  const { siteType, confidence } = pickSiteType(scores);
  const resolvedType: SiteType = isWebshop && siteType !== "webshop" && webshopScore >= scores[siteType] ? "webshop" : siteType;

  return {
    siteType: resolvedType,
    confidence: isWebshop && resolvedType === "webshop" ? (confidence === "low" ? "medium" : confidence) : confidence,
    isWebshop,
    indicators,
    webshop
  };
}

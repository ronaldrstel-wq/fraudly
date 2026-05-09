export type FakeWebshopSignalSeverity = "low" | "medium" | "high";

export type FakeWebshopSignal = {
  id: string;
  label: string;
  severity: FakeWebshopSignalSeverity;
  explanation: string;
};

export type FakeWebshopDetectInput = {
  url: string;
  html?: string;
  domainAgeDays?: number | null;
  pageText?: string;
  priceText?: string | null;
  hasReviews?: boolean | null;
  hasContactPage?: boolean | null;
  hasReturnPolicy?: boolean | null;
  hasCompanyAddress?: boolean | null;
  hasKvKOrVat?: boolean | null;
  paymentMethods?: string[];
  socialPlatform?: string | null;
  adText?: string | null;
  imageSignals?: unknown;
};

const LUXURY_HINTS =
  /\b(gucci|prada|louis vuitton|lv\b|dior|chanel|rolex|cartier|balenciaga|burberry|versace|herm[eè]s|yeezy|jordan retro)\b/i;
const DISCOUNT_HYPE =
  /\b(70%|80%|90%|95%|clearance|mega sale|flash sale|everything must go|liquidation|outlet\s*prices?)\b/i;
const URGENCY = /\b(today only|last chance|limited stock|ends tonight|only\s+\d+\s+left|hurry|act now|while supplies last)\b/i;
const SUSPICIOUS_TLD = /\.(tk|ml|ga|gq|cf|xyz|top|click|download|stream)\b/i;
const CRYPTO_PAY = /\b(bitcoin|btc|ethereum|eth|usdt|crypto|wallet address|send crypto)\b/i;
const WIRE_ONLY = /\b(bank transfer only|wire transfer only|western union|moneygram|zelle only)\b/i;
const GENERIC_FREE_MAIL = /\b[\w.+-]+@(gmail|googlemail|outlook|hotmail|yahoo|icloud)\.com\b/i;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function inferMarkersFromText(text: string) {
  const t = text.toLowerCase();
  return {
    contact:
      /\b(contact us|contact\b|get in touch|customer service|support@|help@|info@)\b/i.test(text) ||
      /mailto:/i.test(text),
    returns: /\b(return policy|refunds?|money[- ]back|satisfaction guarantee|returns and exchanges)\b/i.test(text),
    address:
      /\b(p\.?\s*o\.?\s*box|postcode|postal code|zip code|\b\d{4}\s?[a-z]{2}\b|street|avenue|boulevard)\b/i.test(
        text
      ),
    vat: /\b(vat|btw|kvk|uid|company number|registration|handelsregister|chamber of commerce)\b/i.test(text)
  };
}

function brandLikeDomain(hostname: string): boolean {
  const h = hostname.replace(/^www\./, "").split(".")[0] ?? "";
  if (h.length < 6) return false;
  return LUXURY_HINTS.test(h);
}

export function detectFakeWebshopSignals(input: FakeWebshopDetectInput): {
  riskDelta: number;
  signals: FakeWebshopSignal[];
  summary: string;
} {
  const signals: FakeWebshopSignal[] = [];
  let delta = 0;

  const combined = [input.pageText ?? "", input.html ?? "", input.priceText ?? "", input.adText ?? ""].join("\n");
  const inferred = inferMarkersFromText(combined);
  const hasContact = input.hasContactPage ?? inferred.contact;
  const hasReturns = input.hasReturnPolicy ?? inferred.returns;
  const hasAddr = input.hasCompanyAddress ?? inferred.address;
  const hasVat = input.hasKvKOrVat ?? inferred.vat;

  let host = "";
  try {
    host = new URL(input.url.includes("://") ? input.url : `https://${input.url}`).hostname.toLowerCase();
  } catch {
    host = input.url.toLowerCase();
  }

  const age = input.domainAgeDays;
  const veryNew = typeof age === "number" && age >= 0 && age < 45;
  const established = typeof age === "number" && age > 365;

  const payBlob = [...(input.paymentMethods ?? []), combined].join(" ").toLowerCase();
  const cryptoHeavy = CRYPTO_PAY.test(payBlob) && !/\b(visa|mastercard|paypal|ideal|apple pay|google pay)\b/i.test(payBlob);
  const wireHeavy = WIRE_ONLY.test(payBlob);

  if (veryNew && (DISCOUNT_HYPE.test(combined) || LUXURY_HINTS.test(combined))) {
    delta += 8;
    signals.push({
      id: "new_domain_shop_hype",
      label: "Very new domain with aggressive shop language",
      severity: "high",
      explanation: "The domain looks recently registered while the page pushes discounts or luxury-brand language—often seen with pop-up stores."
    });
  } else if (veryNew) {
    delta += 4;
    signals.push({
      id: "new_domain",
      label: "Recently registered domain",
      severity: "medium",
      explanation: "Very new domains are not automatically fraudulent, but they deserve extra caution for purchases."
    });
  }

  if (DISCOUNT_HYPE.test(combined)) {
    delta += 5;
    signals.push({
      id: "discount_hype",
      label: "Extreme discount claims",
      severity: "medium",
      explanation: "Claims like very high percentage off or clearance-everything patterns are common in scam shops."
    });
  }

  if (URGENCY.test(combined)) {
    delta += 4;
    signals.push({
      id: "urgency_language",
      label: "Urgency pressure",
      severity: "medium",
      explanation: "Phrases that push you to buy immediately reduce your time to verify the seller."
    });
  }

  if (LUXURY_HINTS.test(combined) && /\b(\$|€|£|\d{2,3}\.\d{2})\b/.test(combined)) {
    delta += 5;
    signals.push({
      id: "luxury_price_mix",
      label: "Luxury-brand language with generic pricing cues",
      severity: "medium",
      explanation: "Luxury names paired with unusually cheap offers are a frequent impersonation pattern."
    });
  }

  if (!hasContact) {
    delta += 4;
    signals.push({
      id: "missing_contact",
      label: "No clear contact path",
      severity: "medium",
      explanation: "Legitimate shops usually surface contact options; their absence is a mild negative signal."
    });
  }

  if (!hasReturns) {
    delta += 3;
    signals.push({
      id: "missing_returns",
      label: "Return / refund policy not evident",
      severity: "low",
      explanation: "Missing policy text does not prove a scam, but it removes an important shopper protection signal."
    });
  }

  if (!hasAddr) {
    delta += 3;
    signals.push({
      id: "missing_address",
      label: "No obvious company address",
      severity: "low",
      explanation: "Physical or registered-business addresses help verify who you are dealing with."
    });
  }

  if (!hasVat) {
    delta += 2;
    signals.push({
      id: "missing_registration",
      label: "No VAT / company registration reference spotted",
      severity: "low",
      explanation: "Many EU-facing shops show VAT or company numbers; absence is worth a second look."
    });
  }

  if (cryptoHeavy) {
    delta += 7;
    signals.push({
      id: "crypto_payment",
      label: "Crypto-only style payments",
      severity: "high",
      explanation: "Scam shops often steer buyers toward irreversible crypto transfers instead of card protections."
    });
  } else if (wireHeavy) {
    delta += 5;
    signals.push({
      id: "wire_transfer",
      label: "Bank / wire transfer emphasis",
      severity: "medium",
      explanation: "Exclusive use of manual transfers reduces chargeback protections compared to cards."
    });
  }

  if (input.socialPlatform && input.socialPlatform !== "unknown" && !hasContact) {
    delta += 3;
    signals.push({
      id: "social_weak_site",
      label: "Social ad context with thin on-site business info",
      severity: "medium",
      explanation: "Ads that send you to a site with little verifiable business detail are higher risk."
    });
  }

  if (brandLikeDomain(host)) {
    delta += 4;
    signals.push({
      id: "brand_like_host",
      label: "Domain resembles a luxury brand but is not the official host",
      severity: "medium",
      explanation: "Typosquat or look-alike hostnames are common in counterfeit storefronts."
    });
  }

  if (SUSPICIOUS_TLD.test(host)) {
    delta += 3;
    signals.push({
      id: "risky_tld",
      label: "High-risk or uncommon TLD pattern",
      severity: "low",
      explanation: "Some cheap TLDs are abused heavily; combined with other issues this adds caution."
    });
  }

  if (/return policy|privacy policy|terms of service/i.test(combined) && combined.length < 400) {
    delta += 2;
    signals.push({
      id: "thin_policy",
      label: "Policy pages look very short or boilerplate",
      severity: "low",
      explanation: "Extremely short legal pages can indicate copy-paste templates rather than a real business."
    });
  }

  if (GENERIC_FREE_MAIL.test(combined) && /shop|store|boutique|fashion/i.test(combined)) {
    delta += 3;
    signals.push({
      id: "generic_email_shop",
      label: "Generic free email as primary business contact",
      severity: "medium",
      explanation: "Consumer shops often use a domain-matched inbox; a lone Gmail/Outlook contact is weaker."
    });
  }

  const img = input.imageSignals;
  if (img && typeof img === "object") {
    const o = img as Record<string, unknown>;
    const stocky =
      o.stockLike === true ||
      (typeof o.summary === "string" && /stock|generic|watermark|duplicate/i.test(o.summary)) ||
      (Array.isArray(o.signals) && o.signals.some((s) => typeof s === "string" && /stock|catalog/i.test(s)));
    if (stocky) {
      delta += 3;
      signals.push({
        id: "generic_product_imagery",
        label: "Image hints suggest stock or reused photos",
        severity: "low",
        explanation: "When visuals look like catalog shots with no authentic branding, trust is slightly lower."
      });
    }
  }

  // Trust-positive adjustments
  if (hasAddr && hasReturns && hasContact) {
    delta -= 4;
    signals.push({
      id: "business_transparency",
      label: "Visible contact, address, and returns information",
      severity: "low",
      explanation: "These elements are supportive for a genuine retailer."
    });
  }
  if (hasVat && hasAddr) {
    delta -= 3;
    signals.push({
      id: "registration_signals",
      label: "Registration or VAT cues present",
      severity: "low",
      explanation: "Formal business identifiers reduce impersonation risk somewhat."
    });
  }
  if (established && (input.hasReviews === true || /\breview|rating\b/i.test(combined))) {
    delta -= 3;
    signals.push({
      id: "established_presence",
      label: "Established domain with review language",
      severity: "low",
      explanation: "Older domains with corroborating review mentions are generally safer."
    });
  }
  if (/\b(visa|mastercard|paypal|apple pay|google pay|ideal|klarna|shop pay)\b/i.test(payBlob)) {
    delta -= 2;
    signals.push({
      id: "card_like_payments",
      label: "Recognisable card or wallet checkout options",
      severity: "low",
      explanation: "Mainstream payment rails often offer better buyer protections."
    });
  }

  delta = clamp(delta, -10, 25);

  const top = [...signals].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return rank[b.severity] - rank[a.severity];
  });

  let summary = "No strong fake-shop pattern beyond normal caution.";
  if (delta >= 15) {
    summary =
      "Fraudly found several webshop risk signals, such as a very new domain, urgency-based wording, or limited business transparency.";
  } else if (delta >= 8) {
    summary = "Some webshop-style risk cues showed up—worth double-checking the seller before you pay.";
  } else if (delta <= -4) {
    summary = "The page shows helpful business transparency signals that slightly reduce webshop concern.";
  }

  return { riskDelta: delta, signals: top.slice(0, 12), summary };
}

export type SocialAdSignalSeverity = "low" | "medium" | "high";

export type SocialAdSignal = {
  id: string;
  label: string;
  severity: SocialAdSignalSeverity;
  explanation: string;
};

export type SocialAdDetectInput = {
  platform?: string | null;
  adText?: string | null;
  url: string;
  domain?: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const EXTREME_DISCOUNT = /\b(90%|95%|99%|100%)\s*off|free iphone|free macbook|giveaway\b/i;
const FAKE_GIVEAWAY = /\b(congratulations you won|claim your prize|selected winner|verify now to receive)\b/i;
const SHIPPING_ONLY = /\b(just pay shipping|only pay (?:the )?shipping|shipping fee only)\b/i;
const CELEB = /\b(elon musk|mr beast|jeff bezos|oprah| endorsed by )\b/i;
const CRYPTO_SCAM = /\b(double your (?:btc|bitcoin|eth)|send \d+% back|investment opportunity|guaranteed returns)\b/i;
const URGENT_ACCOUNT = /\b(verify your account|suspended account|unusual login|confirm your password|security alert)\b/i;
const BRAND_IMP = /\b(official (?:store|shop|outlet)|authorized reseller|exclusive deal for followers)\b/i;
const POOR_COPY =
  /\b(click here now!!!|dear customer|kindly revert|congratulation\b|please kindly)\b/i;
const TYPO_DENSE = (s: string) => {
  const words = s.split(/\s+/).filter((w) => w.length > 3);
  if (words.length < 6) return false;
  let odd = 0;
  for (const w of words) {
    if (/^[A-Z]{4,}$/.test(w) || /(.)\1{3,}/.test(w)) odd += 1;
  }
  return odd / words.length > 0.35;
};

function hostFromUrl(url: string): string {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function detectSocialAdRisk(input: SocialAdDetectInput): {
  riskDelta: number;
  signals: SocialAdSignal[];
  summary: string;
} {
  const text = (input.adText ?? "").trim();
  const platform = (input.platform ?? "").trim().toLowerCase() || "unknown";
  const host = (input.domain ?? hostFromUrl(input.url)).toLowerCase().replace(/^www\./, "");
  const signals: SocialAdSignal[] = [];
  let delta = 0;

  const sponsoredContext = platform !== "unknown" && platform !== "other" && text.length > 0;

  if (sponsoredContext && host.length > 0) {
    delta += 3;
    signals.push({
      id: "sponsored_context",
      label: "Sponsored-style context provided",
      severity: "low",
      explanation: "You indicated this link came from a social or ad platform—worth comparing the ad brand with the real domain."
    });
  }

  if (EXTREME_DISCOUNT.test(text)) {
    delta += 5;
    signals.push({
      id: "extreme_discount_ad",
      label: "Extreme discount or “free luxury” wording",
      severity: "high",
      explanation: "Ads promising implausible discounts or free high-value goods are a common scam pattern."
    });
  }

  if (FAKE_GIVEAWAY.test(text)) {
    delta += 5;
    signals.push({
      id: "fake_giveaway",
      label: "Fake giveaway / prize language",
      severity: "high",
      explanation: "Pressure to “claim a prize” is frequently used to harvest payments or account data."
    });
  }

  if (SHIPPING_ONLY.test(text)) {
    delta += 4;
    signals.push({
      id: "shipping_only",
      label: "“Pay shipping only” pattern",
      severity: "medium",
      explanation: "This hook is often tied to subscription traps or counterfeit goods."
    });
  }

  if (CELEB.test(text)) {
    delta += 4;
    signals.push({
      id: "celebrity_misuse",
      label: "Celebrity or influencer misuse wording",
      severity: "medium",
      explanation: "Scam ads often fake endorsements from well-known names."
    });
  }

  if (CRYPTO_SCAM.test(text)) {
    delta += 5;
    signals.push({
      id: "crypto_investment",
      label: "Crypto or “guaranteed return” promises",
      severity: "high",
      explanation: "High-pressure investment language in social ads is a major fraud vector."
    });
  }

  if (URGENT_ACCOUNT.test(text)) {
    delta += 5;
    signals.push({
      id: "urgent_account_security",
      label: "Urgent account or login pressure",
      severity: "high",
      explanation: "Legitimate platforms rarely ask you to confirm passwords via random ad landing pages."
    });
  }

  if (BRAND_IMP.test(text)) {
    delta += 3;
    signals.push({
      id: "brand_impersonation_tone",
      label: "Brand or “official store” impersonation tone",
      severity: "medium",
      explanation: "Scammers mimic official language to borrow trust from brands you recognise."
    });
  }

  if (POOR_COPY.test(text) || TYPO_DENSE(text)) {
    delta += 2;
    signals.push({
      id: "low_quality_copy",
      label: "Low-quality or awkward ad copy",
      severity: "low",
      explanation: "Many scam campaigns reuse machine-translated or rushed text."
    });
  }

  const brandWords = text.match(/\b(nike|adidas|apple|samsung|sony|zara|h&m|ikea|amazon)\b/gi);
  if (brandWords?.length && host.length > 3) {
    const mentioned = brandWords[0]!.toLowerCase();
    if (!host.includes(mentioned.replace(/\s+/g, ""))) {
      delta += 4;
      signals.push({
        id: "brand_domain_mismatch",
        label: "Brand named in the ad does not match the destination domain",
        severity: "high",
        explanation: "If the ad highlights one brand but sends you elsewhere, treat it as impersonation risk."
      });
    }
  }

  delta = clamp(delta, 0, 20);

  let summary = "No strong social-ad red flags in the text you shared.";
  if (delta >= 12) {
    summary =
      "The ad text shows several high-risk patterns (urgency, giveaways, or brand mismatch). Treat the destination site with extra skepticism.";
  } else if (delta >= 5) {
    summary = "A few social-ad risk cues appeared—compare the advertiser with the real website domain before acting.";
  }

  return { riskDelta: delta, signals: signals.slice(0, 10), summary };
}

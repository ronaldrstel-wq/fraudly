type Confidence = "low" | "medium" | "high";

export interface SupplyChainSignals {
  likelyDropshipping: boolean;
  likelyChinaShipping: boolean;
  likelyLocalProduction: boolean;
  confidence: Confidence;
  /** Per-axis confidence for the scoring engine */
  dropshipConfidence: Confidence;
  chinaConfidence: Confidence;
  localConfidence: Confidence;
  reasons: string[];
  scoreAdjustment: number;
}

const CHINA_SHIPPING_MARKERS = [
  "ships from china",
  "china warehouse",
  "aliexpress",
  "cjdropshipping",
  "temu",
  "shein"
];

const DROPSHIP_MARKERS = [
  "7-21 business days",
  "10-20 business days",
  "15-30 days",
  "processing time 3-7 days",
  "international shipping",
  "customs duties",
  "dropship",
  "dropshipping"
];

const LOCAL_MARKERS = [
  "made in netherlands",
  "made in nl",
  "made in the netherlands",
  "made in eu",
  "made in europe",
  "local production",
  "handmade in",
  "own workshop",
  "ships from our warehouse in",
  "next day delivery",
  "1-2 werkdagen",
  "same day delivery"
];

const GENERIC_SUPPLIER_PHRASES = [
  "high quality",
  "factory direct",
  "wholesale price",
  "best seller",
  "limited time offer",
  "clearance sale"
];

function countMatches(haystack: string, needles: readonly string[]): number {
  let n = 0;
  for (const needle of needles) {
    if (haystack.includes(needle)) n += 1;
  }
  return n;
}

function chinaTier(hits: number): Confidence {
  if (hits >= 2) return "high";
  if (hits === 1) return "medium";
  return "low";
}

function dropshipTier(dropHits: number, discountHeavy: boolean, genericHits: number): Confidence {
  const score = dropHits + (discountHeavy ? 2 : 0) + Math.min(2, genericHits);
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  if (score >= 1) return "low";
  return "low";
}

function localTier(localHits: number, hasKvk: boolean): Confidence {
  const score = localHits + (hasKvk ? 2 : 0);
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

function computeScoreAdjustment(input: {
  likelyDropshipping: boolean;
  likelyChinaShipping: boolean;
  likelyLocalProduction: boolean;
  dropConf: Confidence;
  chinaConf: Confidence;
  localConf: Confidence;
}): number {
  let adj = 0;

  if (input.likelyLocalProduction) {
    if (input.localConf === "high") adj -= 15;
    else if (input.localConf === "medium") adj -= 8;
  }

  let pos = 0;
  if (input.likelyChinaShipping && input.chinaConf === "high") pos += 25;
  else if (input.likelyChinaShipping && input.chinaConf === "medium") pos += 10;

  if (input.likelyDropshipping && input.dropConf === "high") pos += 20;
  else if (input.likelyDropshipping && input.dropConf === "medium") pos += 10;

  pos = Math.min(35, pos);
  adj += pos;
  return adj;
}

function overallConfidence(dropConf: Confidence, chinaConf: Confidence, localConf: Confidence): Confidence {
  const order: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
  const ranked = [dropConf, chinaConf, localConf].sort((a, b) => order[b] - order[a]);
  return ranked[0];
}

/**
 * Heuristic supply-chain hints from visible website text (snippet-level, not guaranteed accurate).
 */
export async function getSupplyChainSignals(domain: string, websiteText: string): Promise<SupplyChainSignals> {
  const reasons: string[] = [];
  const t = websiteText.trim();
  const lower = t.toLowerCase();

  if (!t) {
    return {
      likelyDropshipping: false,
      likelyChinaShipping: false,
      likelyLocalProduction: false,
      confidence: "low",
      dropshipConfidence: "low",
      chinaConfidence: "low",
      localConfidence: "low",
      reasons: ["Not enough website text to assess supply chain."],
      scoreAdjustment: 0
    };
  }

  const isNlSite = domain.toLowerCase().endsWith(".nl");
  const hasKvk = /\b(?:kvk|kamer\s*van\s*koophandel)\b/i.test(t) && /\b\d{8}\b/.test(t);
  const discountHeavy = /(?:7\d|8\d|9\d)\s*%/.test(lower) || /\b(?:70|80|90)\s*%\s*(?:off|korting|discount)/i.test(t);

  const chinaHits = countMatches(lower, CHINA_SHIPPING_MARKERS);
  const dropHits = countMatches(lower, DROPSHIP_MARKERS);
  const localHits = countMatches(lower, LOCAL_MARKERS);
  const genericHits = countMatches(lower, GENERIC_SUPPLIER_PHRASES);

  const chinaConf = chinaTier(chinaHits);
  const dropConf = dropshipTier(dropHits, discountHeavy, genericHits);
  const localConf = localTier(localHits, hasKvk);

  if (chinaHits > 0) {
    reasons.push("Shipping or marketplace language suggests China-linked fulfillment.");
  }
  if (dropHits > 0) {
    reasons.push("Long international shipping or processing windows were mentioned.");
  }
  if (genericHits >= 2) {
    reasons.push("Product copy looks generic or supplier-style.");
  } else if (genericHits === 1) {
    reasons.push("Some generic supplier-style wording was found.");
  }
  if (discountHeavy) {
    reasons.push("Very large discounts (70%+) were advertised.");
  }
  if (isNlSite && !hasKvk) {
    reasons.push("No obvious KvK / Chamber of Commerce number in the page snippet.");
  }
  if (t.length < 220) {
    reasons.push("Little on-page business or address detail in the captured snippet.");
  }
  if (localHits > 0 || hasKvk) {
    reasons.push("Signals of local production, EU origin, or local fulfillment were found.");
  }

  const likelyChinaShipping = chinaConf === "medium" || chinaConf === "high";
  const likelyDropshipping = dropConf === "medium" || dropConf === "high";
  const likelyLocalProduction = localConf === "medium" || localConf === "high";

  if (!likelyChinaShipping && !likelyDropshipping && !likelyLocalProduction) {
    return {
      likelyDropshipping: false,
      likelyChinaShipping: false,
      likelyLocalProduction: false,
      confidence: "low",
      dropshipConfidence: dropConf,
      chinaConfidence: chinaConf,
      localConfidence: localConf,
      reasons: ["No strong supply-chain signals detected in snippet."],
      scoreAdjustment: 0
    };
  }

  const confidence = overallConfidence(dropConf, chinaConf, localConf);

  const scoreAdjustment = computeScoreAdjustment({
    likelyDropshipping,
    likelyChinaShipping,
    likelyLocalProduction,
    dropConf,
    chinaConf,
    localConf
  });

  const uniqueReasons = [...new Set(reasons)].slice(0, 5);

  return {
    likelyDropshipping,
    likelyChinaShipping,
    likelyLocalProduction,
    confidence,
    dropshipConfidence: dropConf,
    chinaConfidence: chinaConf,
    localConfidence: localConf,
    reasons: uniqueReasons.length > 0 ? uniqueReasons : ["No strong supply-chain signals detected in snippet."],
    scoreAdjustment
  };
}

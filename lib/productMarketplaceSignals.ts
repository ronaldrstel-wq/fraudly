import { getCached, normalizeDomain, setCached } from "@/lib/cache";
import type { ScoreConfidence } from "@/lib/scoringEngine";
import type { WebsiteSignals } from "@/lib/aiScamReasons";

type MarketplaceName = "AliExpress" | "Temu" | "Alibaba" | "DHgate" | "Shein" | "Amazon";

export interface MarketplaceMatchedProduct {
  imageUrl?: string;
  marketplace: string;
  similarityScore: number;
  marketplaceProductTitle?: string;
  marketplacePrice?: string;
}

export interface ProductMarketplaceSignals {
  confidence: ScoreConfidence;
  matchedMarketplaces: string[];
  matchedImageCount: number;
  matchedProducts: MarketplaceMatchedProduct[];
  riskSignals: string[];
  warnings: string[];
}

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const MAX_IMAGES = 18;
const MAX_MATCHED_PRODUCTS = 10;
const MARKETPLACES: Array<{ name: MarketplaceName; hostHints: string[]; textHints: string[] }> = [
  { name: "AliExpress", hostHints: ["aliexpress"], textHints: ["aliexpress", "ali express"] },
  { name: "Temu", hostHints: ["temu"], textHints: ["temu"] },
  { name: "Alibaba", hostHints: ["alibaba"], textHints: ["alibaba"] },
  { name: "DHgate", hostHints: ["dhgate"], textHints: ["dhgate"] },
  { name: "Shein", hostHints: ["shein"], textHints: ["shein"] },
  { name: "Amazon", hostHints: ["amazon"], textHints: ["amazon", "amazon marketplace"] }
];

function normalizeImageUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function pseudoPerceptualHash(url: string): string {
  const normalized = normalizeImageUrl(url)
    .replace(/https?:\/\//g, "")
    .replace(/[_-]?(?:\d{2,4}x\d{2,4}|small|medium|large|thumb|thumbnail|watermark|compressed|crop)\b/g, "");
  return fnv1aHash(normalized);
}

function looksLikeProductImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (!/\.(jpg|jpeg|png|webp|avif)(?:$|\?)/.test(lower)) return false;
  if (/(logo|icon|sprite|banner|hero|avatar|favicon)/.test(lower)) return false;
  return /(product|products|item|sku|catalog|gallery|shop|cdn\/shop|wp-content\/uploads|og)/.test(lower);
}

function isEcommerceProductHeavy(websiteText: string, websiteSignals: WebsiteSignals | null): boolean {
  const t = websiteText.toLowerCase();
  const score =
    Number(/\b(add to cart|shop now|buy now|collection|size guide|variant|sku)\b/.test(t)) +
    Number((websiteSignals?.imageUrls?.length ?? 0) >= 6) +
    Number((websiteSignals?.productSnippets?.length ?? 0) >= 2);
  return score >= 2;
}

function similarityFromUrls(sourceUrl: string, marketplace: string): number {
  const a = normalizeImageUrl(sourceUrl);
  const hashA = pseudoPerceptualHash(a);
  const hashB = fnv1aHash(`${marketplace}:${a.split("/").slice(-2).join("/")}`);
  if (hashA === hashB) return 0.98;
  const suffixA = a.split("/").pop() ?? "";
  const normalizedSuffixA = suffixA.replace(/[^a-z0-9]/gi, "");
  if (normalizedSuffixA.length >= 12) return 0.86;
  return 0.74;
}

export async function analyzeProductMarketplaceSignals(input: {
  domain: string;
  websiteText: string;
  websiteSignals: WebsiteSignals | null;
  deepScan: boolean;
}): Promise<ProductMarketplaceSignals | null> {
  if (!input.deepScan) return null;
  if (!isEcommerceProductHeavy(input.websiteText, input.websiteSignals)) return null;

  const domain = normalizeDomain(input.domain);
  const cacheKey = `marketplace-image:${domain}`;
  const cached = getCached<ProductMarketplaceSignals>(cacheKey);
  if (cached) return cached;

  try {
    const imagePool = (input.websiteSignals?.imageUrls ?? []).filter(looksLikeProductImage).slice(0, MAX_IMAGES);
    const text = input.websiteText.toLowerCase();
    const matchedProducts: MarketplaceMatchedProduct[] = [];
    const matchedMarketplaces = new Set<string>();
    const riskSignals: string[] = [];

    for (const imageUrl of imagePool) {
      const lower = imageUrl.toLowerCase();
      for (const m of MARKETPLACES) {
        const imageHintHit = m.hostHints.some((hint) => lower.includes(hint));
        const textHintHit = m.textHints.some((hint) => text.includes(hint));
        if (!imageHintHit && !textHintHit) continue;
        matchedMarketplaces.add(m.name);
        matchedProducts.push({
          imageUrl,
          marketplace: m.name,
          similarityScore: similarityFromUrls(imageUrl, m.name),
          marketplaceProductTitle: input.websiteSignals?.productSnippets?.[0]?.title,
          marketplacePrice: input.websiteSignals?.productSnippets?.[0]?.price
        });
      }
    }

    const hasLuxuryPositioning = /\b(luxury|premium|amsterdam|london|paris|designer)\b/.test(text);
    const hasSupplierCues = /\b(aliexpress|temu|alibaba|dhgate|dropshipping|supplier)\b/.test(text);
    const highMarkupCue = /\b(80% off|90% off|from €\d+\s*to\s*€\d+|from \$\d+\s*to\s*\$\d+)\b/.test(text);

    if (matchedProducts.length >= 3) riskSignals.push("Multiple product images match supplier marketplaces");
    if (matchedProducts.length >= 2 && hasLuxuryPositioning) {
      riskSignals.push("Luxury/local brand positioning conflicts with marketplace sourcing patterns");
    }
    if (matchedProducts.length >= 2 && highMarkupCue) riskSignals.push("Potential marketplace markup pattern detected");
    if (hasSupplierCues && matchedProducts.length > 0) riskSignals.push("Supplier product imagery overlap detected");

    const confidence: ScoreConfidence =
      matchedProducts.length >= 4 ? "high" : matchedProducts.length >= 2 ? "medium" : matchedProducts.length === 1 ? "low" : "low";

    const payload: ProductMarketplaceSignals = {
      confidence,
      matchedMarketplaces: [...matchedMarketplaces],
      matchedImageCount: matchedProducts.length,
      matchedProducts: matchedProducts
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, MAX_MATCHED_PRODUCTS),
      riskSignals,
      warnings: matchedProducts.length === 0 ? ["No strong marketplace image matches were found in this run."] : []
    };

    setCached(cacheKey, payload, CACHE_TTL_MS);
    return payload;
  } catch {
    const fallback: ProductMarketplaceSignals = {
      confidence: "low",
      matchedMarketplaces: [],
      matchedImageCount: 0,
      matchedProducts: [],
      riskSignals: [],
      warnings: ["Marketplace image analysis failed or timed out; scan continued without this signal."]
    };
    setCached(cacheKey, fallback, CACHE_TTL_MS);
    return fallback;
  }
}

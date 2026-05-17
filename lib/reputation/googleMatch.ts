import { parse } from "tldts";
import type { CompanyIdentity } from "@/lib/reputation/companyIdentity";
import { GOOGLE_MIN_CONFIDENCE_FOR_TRUST_SCORE } from "@/lib/reputation/reviewConfig";

export type GoogleMatchConfidence = "high" | "medium" | "low" | "none";

export type GoogleBusinessCandidate = {
  rating: number | null;
  reviewCount: number | null;
  businessName?: string | null;
  website?: string | null;
  placeId?: string | null;
  queryUsed?: string | null;
};

export type GoogleMatchValidation = {
  accepted: boolean;
  confidence: GoogleMatchConfidence;
  /** Normalized 0–1 confidence for scoring gates. */
  score: number;
  exactDomainMatch: boolean;
  reasons: string[];
  matchedDomain?: string;
  matchedBusinessName?: string;
  googleWebsite?: string;
};

const LEGAL_SUFFIX_RE =
  /\b(b\.?\s*v\.?|bv|llc|l\.?\s*l\.?\s*c\.?|ltd\.?|limited|inc\.?|gmbh|ag|s\.?\s*a\.?\s*s\.?|sarl|plc|corp\.?)\b/gi;

export function registrableHost(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const withProtocol = value.includes("://") ? value : `https://${value}`;
    const host = new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
    const parsed = parse(host, { allowPrivateDomains: true });
    return (parsed.domain ?? host).toLowerCase();
  } catch {
    const cleaned = value.toLowerCase().replace(/^www\./, "").split("/")[0]?.trim();
    if (!cleaned) return null;
    const parsed = parse(cleaned, { allowPrivateDomains: true });
    return (parsed.domain ?? cleaned).toLowerCase();
  }
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(LEGAL_SUFFIX_RE, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlapScore(a: string, b: string): number {
  const tokensA = new Set(normalizeName(a).split(" ").filter((t) => t.length >= 2));
  const tokensB = new Set(normalizeName(b).split(" ").filter((t) => t.length >= 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

function hasContradictoryDomain(profileDomain: string | null, scannedDomain: string): boolean {
  if (!profileDomain) return false;
  const scanned = registrableHost(scannedDomain);
  if (!scanned) return false;
  if (profileDomain === scanned) return false;
  return !profileDomain.endsWith(`.${scanned}`) && !scanned.endsWith(`.${profileDomain}`);
}

export function validateGoogleBusinessMatch(
  candidate: GoogleBusinessCandidate,
  scannedDomain: string,
  companyIdentity: CompanyIdentity | null | undefined
): GoogleMatchValidation {
  const reasons: string[] = [];
  const scannedRegistrable = registrableHost(scannedDomain) ?? scannedDomain.toLowerCase();
  const profileDomain = registrableHost(candidate.website ?? null);
  const matchedBusinessName = candidate.businessName?.trim() || null;
  const googleWebsite = candidate.website?.trim() || null;

  const exactDomainMatch = Boolean(profileDomain && profileDomain === scannedRegistrable);

  if (exactDomainMatch) {
    reasons.push("google_profile_domain_matches_scanned_domain");
    return {
      accepted: true,
      confidence: "high",
      score: 1,
      exactDomainMatch: true,
      reasons,
      matchedDomain: profileDomain ?? undefined,
      matchedBusinessName: matchedBusinessName ?? undefined,
      googleWebsite: googleWebsite ?? undefined
    };
  }

  if (profileDomain && hasContradictoryDomain(profileDomain, scannedRegistrable)) {
    reasons.push("google_profile_domain_contradicts_scanned_domain");
    return {
      accepted: false,
      confidence: "low",
      score: 0.15,
      exactDomainMatch: false,
      reasons,
      matchedDomain: profileDomain,
      matchedBusinessName: matchedBusinessName ?? undefined,
      googleWebsite: googleWebsite ?? undefined
    };
  }

  const identityNames = [
    companyIdentity?.primaryName,
    ...(companyIdentity?.candidates ?? [])
  ].filter(Boolean) as string[];

  let bestOverlap = 0;
  if (matchedBusinessName && identityNames.length > 0) {
    for (const name of identityNames) {
      bestOverlap = Math.max(bestOverlap, tokenOverlapScore(matchedBusinessName, name));
    }
  }

  if (bestOverlap >= 0.75 && profileDomain) {
    reasons.push("google_name_strong_match_with_website_but_domain_not_exact");
    return {
      accepted: true,
      confidence: "medium",
      score: 0.68,
      exactDomainMatch: false,
      reasons,
      matchedDomain: profileDomain,
      matchedBusinessName: matchedBusinessName ?? undefined,
      googleWebsite: googleWebsite ?? undefined
    };
  }

  if (bestOverlap >= 0.75 && !profileDomain) {
    reasons.push("google_name_strong_match_no_profile_website");
    return {
      accepted: true,
      confidence: "medium",
      score: 0.55,
      exactDomainMatch: false,
      reasons,
      matchedBusinessName: matchedBusinessName ?? undefined,
      googleWebsite: googleWebsite ?? undefined
    };
  }

  if (candidate.rating != null || candidate.reviewCount != null) {
    reasons.push(
      profileDomain ? "google_weak_domain_or_name_match" : "google_no_website_on_profile"
    );
  }

  return {
    accepted: false,
    confidence: "low",
    score: Math.max(0.2, bestOverlap * 0.35),
    exactDomainMatch: false,
    reasons,
    matchedDomain: profileDomain ?? undefined,
    matchedBusinessName: matchedBusinessName ?? undefined,
    googleWebsite: googleWebsite ?? undefined
  };
}

export function googleValidationIsDisplayable(validation: GoogleMatchValidation): boolean {
  return validation.confidence === "high" && validation.exactDomainMatch;
}

export function googleValidationAffectsTrustScore(validation: GoogleMatchValidation): boolean {
  return (
    validation.confidence === "high" &&
    validation.exactDomainMatch &&
    validation.score >= GOOGLE_MIN_CONFIDENCE_FOR_TRUST_SCORE
  );
}

export function logGoogleMatchDebug(args: {
  domain: string;
  businessName: string | null;
  googleWebsite: string | null;
  confidence: GoogleMatchConfidence;
  confidenceScore: number;
  exactDomainMatch: boolean;
  usedInTrustScore: boolean;
  reasons?: string[];
}): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[Fraudly][GoogleMatch]", {
    domain: args.domain,
    businessName: args.businessName,
    googleWebsite: args.googleWebsite,
    confidence: args.confidence,
    confidenceScore: args.confidenceScore,
    exactDomainMatch: args.exactDomainMatch,
    usedInTrustScore: args.usedInTrustScore,
    reasons: args.reasons
  });
}

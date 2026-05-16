import { parse } from "tldts";
import type { CompanyIdentity } from "@/lib/reputation/companyIdentity";

export type TrustpilotMatchConfidence = "high" | "medium" | "low";

export type TrustpilotCandidate = {
  rating: number | null;
  reviewCount: number | null;
  companyName?: string | null;
  website?: string | null;
  profileUrl?: string | null;
  rawDomain?: string | null;
};

export type TrustpilotValidation = {
  accepted: boolean;
  confidence: TrustpilotMatchConfidence | "none";
  score: number;
  reasons: string[];
  matchedDomain?: string;
  matchedCompanyName?: string;
  profileUrl?: string;
};

const LEGAL_SUFFIX_RE =
  /\b(b\.?\s*v\.?|bv|llc|l\.?\s*l\.?\s*c\.?|ltd\.?|limited|inc\.?|gmbh|ag|s\.?\s*a\.?\s*s\.?|sarl|plc|corp\.?)\b/gi;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(LEGAL_SUFFIX_RE, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function registrableHost(value: string | null | undefined): string | null {
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

export function validateTrustpilotMatch(
  candidate: TrustpilotCandidate,
  scannedDomain: string,
  companyIdentity: CompanyIdentity | null | undefined
): TrustpilotValidation {
  const reasons: string[] = [];
  const scannedRegistrable = registrableHost(scannedDomain) ?? scannedDomain.toLowerCase();
  const profileDomain = registrableHost(candidate.website ?? candidate.rawDomain ?? null);
  const matchedCompanyName = candidate.companyName?.trim() || null;
  const profileUrl = candidate.profileUrl?.trim() || null;

  if (profileDomain && profileDomain === scannedRegistrable) {
    reasons.push("profile_domain_matches_scanned_domain");
    return {
      accepted: true,
      confidence: "high",
      score: 100,
      reasons,
      matchedDomain: profileDomain,
      matchedCompanyName: matchedCompanyName ?? undefined,
      profileUrl: profileUrl ?? undefined
    };
  }

  if (profileDomain && hasContradictoryDomain(profileDomain, scannedRegistrable)) {
    reasons.push("profile_domain_contradicts_scanned_domain");
    return {
      accepted: false,
      confidence: "low",
      score: 10,
      reasons,
      matchedDomain: profileDomain,
      matchedCompanyName: matchedCompanyName ?? undefined,
      profileUrl: profileUrl ?? undefined
    };
  }

  const identityNames = [
    companyIdentity?.primaryName,
    ...(companyIdentity?.candidates ?? [])
  ].filter(Boolean) as string[];

  let bestOverlap = 0;
  let bestName: string | null = null;
  if (matchedCompanyName && identityNames.length > 0) {
    for (const name of identityNames) {
      const overlap = tokenOverlapScore(matchedCompanyName, name);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestName = name;
      }
    }
  }

  if (bestOverlap >= 0.75) {
    reasons.push("company_name_strong_match");
    return {
      accepted: true,
      confidence: "medium",
      score: Math.round(60 + bestOverlap * 35),
      reasons,
      matchedDomain: profileDomain ?? undefined,
      matchedCompanyName: matchedCompanyName ?? undefined,
      profileUrl: profileUrl ?? undefined
    };
  }

  if (bestOverlap >= 0.5 && !profileDomain) {
    reasons.push("company_name_fuzzy_match_no_profile_domain");
    return {
      accepted: true,
      confidence: "medium",
      score: Math.round(50 + bestOverlap * 30),
      reasons,
      matchedCompanyName: matchedCompanyName ?? undefined,
      profileUrl: profileUrl ?? undefined
    };
  }

  if (candidate.rating != null || candidate.reviewCount != null) {
    reasons.push(profileDomain ? "weak_domain_or_name_match" : "no_domain_only_provider_payload");
  }

  return {
    accepted: false,
    confidence: "low",
    score: Math.round(bestOverlap * 40),
    reasons,
    matchedDomain: profileDomain ?? undefined,
    matchedCompanyName: matchedCompanyName ?? undefined,
    profileUrl: profileUrl ?? undefined
  };
}

export function trustpilotValidationIsDisplayable(
  confidence: TrustpilotValidation["confidence"]
): boolean {
  return confidence === "high" || confidence === "medium";
}

export function trustpilotValidationAffectsScore(confidence: TrustpilotValidation["confidence"]): boolean {
  return confidence === "high";
}

/**
 * Lexical / structural domain heuristics for fraud scoring.
 * TLD tiers: “soft” (common for startups — small nudge alone) vs “hard” disposable TLD.
 * Random-looking requires multiple corroborating signals to reduce Dutch/German/brand false positives.
 */

import { isOfficialOrGovernmentRegistrableHost } from "@/config/official-domains";

const SOFT_SUSPICIOUS_TLDS = new Set(["xyz", "online", "site", "live"]);
const HARD_SUSPICIOUS_TLDS = new Set(["cam", "top", "click", "bond", "shop"]);

/** Letters treated as vowels for ratio (Western EU–friendly heuristic, not linguistic perfection). */
const VOWELS_RE =
  /[aeiouàáâãäåèéêëìíîïòóôõöùúûüůýÿæœ]/i;

const AUTHORITY_BOUNDARY_REGEX =
  /\b(?:gov|government|overheid|belasting(?:dienst)?|ministerie|ministry|gemeente|official|verify|support|wallet|secure|bank|login|account)\b/i;

const INLINE_GOVISH = /gov|government|overheid|ministerie/i;

export type DomainPatternAnalysis = {
  registrableHostname: string;
  apexLabels: string[];
  publicSuffix: string;
  registrableJoined: string;
  /** Highest TLD nuisance tier from the public suffix. */
  tldRiskTier: "none" | "soft" | "hard";
  /** True when apex matches disposable / spoofing-associated suffix. */
  suspiciousTldSoft: boolean;
  suspiciousTldHard: boolean;
  officialRegistrableExempt: boolean;
  fakeAuthoritySubstringInApex: boolean;
  subdomainCount: number;
  highEntropyApexLabel: boolean;
  gibberishSignalsAgreed: number;
  /** True only when ≥2 heuristic bits agree OR short obviously meaningless slug. */
  combinedGibberishApex: boolean;
  deceptiveSubdomainPattern: boolean;
  /** High lexical suspicion for caps and combined risk (not triggered by soft TLD alone). */
  hasStrongLexicalSuspicion: boolean;
};

function shannonEntropyAlphaNum(label: string): number {
  const core = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (core.length < 2) return 0;
  const counts = new Map<string, number>();
  for (const ch of core) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let h = 0;
  const n = core.length;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

function vowelRatioIntl(label: string): number {
  const letters = label.toLowerCase().replace(/[^a-zàáâãäåèéêëìíîïòóôõöùúûüůýÿæœ]/gi, "");
  if (!letters.length) return 0;
  let vowels = 0;
  for (let i = 0; i < letters.length; i++) {
    if (VOWELS_RE.test(letters[i] ?? "")) vowels++;
  }
  return vowels / letters.length;
}

function longestConsonantRunIntl(label: string): number {
  const s = label.toLowerCase();
  let max = 0;
  let cur = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const isLetter = /[a-zàáâãäåèéêëìíîïòóôõöùúûüůýÿæœ]/i.test(ch ?? "");
    const isVowel = VOWELS_RE.test(ch ?? "");
    if (isLetter && !isVowel) cur += 1;
    else cur = 0;
    max = Math.max(max, cur);
  }
  return max;
}

/** Rough “word-shape” heuristic: hyphenated brandable segments aren’t inherently random. */
function hasComfortableHyphenNaturalism(apexLabel: string): boolean {
  const parts = apexLabel.toLowerCase().split(/[-_]/).filter((p) => p.length >= 4);
  if (parts.length === 0) return false;
  return parts.some((p) => vowelRatioIntl(p) >= 0.28);
}

function splitHost(hostname: string): string[] {
  return hostname.split(".").filter(Boolean).map((p) => p.toLowerCase());
}

export function analyzeDomainPatterns(domainInput: string): DomainPatternAnalysis {
  const trimmed = domainInput.trim().toLowerCase().replace(/^https?:\/\//, "");
  const hostname = trimmed.split(/[/?#]/)[0]!;
  let host = hostname;
  if (host.includes(":")) {
    const [h] = host.split(":");
    if (h) host = h;
  }
  const labels = splitHost(host);
  if (labels.length === 0) {
    return {
      registrableHostname: host,
      apexLabels: [],
      publicSuffix: "",
      registrableJoined: "",
      tldRiskTier: "none",
      suspiciousTldSoft: false,
      suspiciousTldHard: false,
      officialRegistrableExempt: false,
      fakeAuthoritySubstringInApex: false,
      subdomainCount: 0,
      highEntropyApexLabel: false,
      gibberishSignalsAgreed: 0,
      combinedGibberishApex: false,
      deceptiveSubdomainPattern: false,
      hasStrongLexicalSuspicion: false
    };
  }

  let publicSuffix = labels[labels.length - 1] ?? "";
  let registrableStart = labels.length >= 2 ? labels.length - 2 : labels.length - 1;
  if (labels.length >= 3) {
    const double = `${labels[labels.length - 2]}.${labels[labels.length - 1]}`;
    if (labels[labels.length - 2] === "co" && labels[labels.length - 1] === "uk") {
      publicSuffix = double;
      registrableStart = labels.length - 3;
    }
  }

  const registrableLabels = registrableStart >= 0 ? labels.slice(registrableStart) : labels;
  const registrableJoined = registrableLabels.join(".");
  const apexLabel = registrableLabels[0] ?? "";
  const publicSuffixEffective = registrableLabels.length >= 2 ? registrableLabels[1] ?? publicSuffix : publicSuffix;

  const suspiciousTldSoft = SOFT_SUSPICIOUS_TLDS.has(publicSuffixEffective);
  const suspiciousTldHard = HARD_SUSPICIOUS_TLDS.has(publicSuffixEffective);
  const tldRiskTier = suspiciousTldHard ? "hard" : suspiciousTldSoft ? "soft" : "none";
  const subdomainCount = Math.max(0, registrableStart);

  const officialRegistrableExempt = isOfficialOrGovernmentRegistrableHost(registrableJoined);

  const h = apexLabel.length >= 8 ? shannonEntropyAlphaNum(apexLabel) : 0;
  const vr = vowelRatioIntl(apexLabel);
  const cons = longestConsonantRunIntl(apexLabel);
  const highEntropyApexLabel = apexLabel.length >= 8 && h >= 3.55;

  let gibberishSignalsAgreed = 0;
  if (apexLabel.length >= 8 && highEntropyApexLabel) gibberishSignalsAgreed += 1;
  if (vr < 0.18 && apexLabel.length >= 8) gibberishSignalsAgreed += 1;
  if (cons >= 5 && apexLabel.length >= 6) gibberishSignalsAgreed += 1;
  if (/^\d+[a-z]*\d+[a-z0-9]*$/i.test(apexLabel.replace(/[-_]/g, "")) && apexLabel.length <= 14) gibberishSignalsAgreed += 1;

  if (apexLabel.includes("-") && hasComfortableHyphenNaturalism(apexLabel)) {
    gibberishSignalsAgreed = Math.max(0, gibberishSignalsAgreed - 2);
  }
  if (!officialRegistrableExempt && apexLabel.length >= 22 && vr >= 0.26) gibberishSignalsAgreed -= 1;

  gibberishSignalsAgreed = Math.max(0, gibberishSignalsAgreed);

  const combinedGibberishApex =
    gibberishSignalsAgreed >= 2 ||
    (gibberishSignalsAgreed >= 1 &&
      apexLabel.length >= 6 &&
      apexLabel.length <= 11 &&
      (vr < 0.22 || cons >= 4) &&
      !apexLabel.includes("-"));

  let fakeAuthoritySubstringInApex = false;
  const coreForAuth = apexLabel.replace(/-/g, "");
  if (coreForAuth && !officialRegistrableExempt && !registrableJoined.endsWith(".gov")) {
    if (AUTHORITY_BOUNDARY_REGEX.test(apexLabel)) {
      fakeAuthoritySubstringInApex = true;
    } else if (
      INLINE_GOVISH.test(apexLabel) &&
      (tldRiskTier !== "none" || combinedGibberishApex)
    ) {
      fakeAuthoritySubstringInApex = true;
    }
  }

  let deceptiveSubdomainPattern = false;
  if (subdomainCount >= 1 && combinedGibberishApex && tldRiskTier === "hard") {
    const left = labels[registrableStart - 1] ?? "";
    if (left && left.length <= 4 && /^[a-z]{1,4}$/.test(left)) deceptiveSubdomainPattern = true;
  }

  const hasStrongLexicalSuspicion =
    (fakeAuthoritySubstringInApex && tldRiskTier === "hard") ||
    (fakeAuthoritySubstringInApex && combinedGibberishApex) ||
    (deceptiveSubdomainPattern && fakeAuthoritySubstringInApex);

  return {
    registrableHostname: registrableJoined,
    apexLabels: registrableLabels,
    publicSuffix: publicSuffixEffective,
    registrableJoined,
    tldRiskTier,
    suspiciousTldSoft,
    suspiciousTldHard,
    officialRegistrableExempt,
    fakeAuthoritySubstringInApex,
    subdomainCount,
    highEntropyApexLabel,
    gibberishSignalsAgreed,
    combinedGibberishApex,
    deceptiveSubdomainPattern,
    hasStrongLexicalSuspicion
  };
}

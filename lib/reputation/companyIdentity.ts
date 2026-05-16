import { parse } from "tldts";

export type CompanyIdentityEvidence = {
  ogSiteName?: string;
  title?: string;
  organizationSchema?: string;
  websiteSchema?: string;
  applicationName?: string;
  h1?: string;
  copyright?: string;
  domainLabel?: string;
};

export type CompanyIdentity = {
  primaryName: string | null;
  candidates: string[];
  evidence: CompanyIdentityEvidence;
};

const LEGAL_SUFFIX_RE =
  /\b(b\.?\s*v\.?|bv|llc|l\.?\s*l\.?\s*c\.?|ltd\.?|limited|inc\.?|incorporated|gmbh|ag|s\.?\s*a\.?\s*s\.?|sarl|plc|corp\.?|corporation|co\.?)\b/gi;

const NOISE_WORDS_RE =
  /\b(official|homepage|home\s*page|website|web\s*site|online\s*shop|webshop|e-?shop|store|shop|welcome\s*to)\b/gi;

const MAX_CANDIDATES = 8;
const MIN_NAME_LENGTH = 3;

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCompanyName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = decodeBasicEntities(raw);
  value = value.split(/[|/•·–—]/)[0]?.trim() ?? value;
  value = value.replace(LEGAL_SUFFIX_RE, "").replace(NOISE_WORDS_RE, "");
  value = value.replace(/\s{2,}/g, " ").trim();
  if (value.length < MIN_NAME_LENGTH) return null;
  return value;
}

function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeBasicEntities(match[1]);
  }
  return null;
}

function titleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeBasicEntities(match[1]) : null;
}

function firstH1(html: string): string | null {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match?.[1]) return null;
  return decodeBasicEntities(match[1].replace(/<[^>]+>/g, " "));
}

function copyrightLine(html: string): string | null {
  const match = html.match(/©\s*([^<\n]{2,80})/i) ?? html.match(/copyright\s*©?\s*([^<\n]{2,80})/i);
  return match?.[1] ? decodeBasicEntities(match[1]) : null;
}

function schemaOrgNames(html: string): { organization?: string; website?: string } {
  const out: { organization?: string; website?: string } = {};
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of scripts) {
    const jsonText = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const row = node as Record<string, unknown>;
        const type = String(row["@type"] ?? "").toLowerCase();
        const name = typeof row.name === "string" ? row.name : null;
        if (!name) continue;
        if (type.includes("organization") && !out.organization) out.organization = name;
        if (type.includes("website") && !out.website) out.website = name;
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return out;
}

function domainLabelFromHostname(domain: string): string | null {
  const parsed = parse(domain, { allowPrivateDomains: true });
  const label = (parsed.domainWithoutSuffix ?? parsed.domain ?? domain).split(".")[0] ?? "";
  if (!label || label.length < MIN_NAME_LENGTH) return null;
  const words = label.replace(/[-_]+/g, " ").trim();
  if (!words) return null;
  return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

function uniqueCandidates(names: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const cleaned = cleanCompanyName(raw);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

export function extractCompanyIdentity(html: string | null | undefined, domain: string): CompanyIdentity {
  const evidence: CompanyIdentityEvidence = {};
  const registrable = parse(domain, { allowPrivateDomains: true }).domain ?? domain;
  evidence.domainLabel = domainLabelFromHostname(registrable) ?? undefined;

  const names: Array<string | null | undefined> = [evidence.domainLabel];

  if (html && html.trim()) {
    evidence.ogSiteName = metaContent(html, "og:site_name") ?? undefined;
    evidence.applicationName = metaContent(html, "application-name") ?? undefined;
    evidence.title = titleFromHtml(html) ?? undefined;
    evidence.h1 = firstH1(html) ?? undefined;
    evidence.copyright = copyrightLine(html) ?? undefined;
    const schema = schemaOrgNames(html);
    evidence.organizationSchema = schema.organization;
    evidence.websiteSchema = schema.website;

    names.push(
      evidence.ogSiteName,
      evidence.organizationSchema,
      evidence.websiteSchema,
      evidence.applicationName,
      evidence.h1,
      evidence.title,
      evidence.copyright
    );
  }

  const candidates = uniqueCandidates(names);
  return {
    primaryName: candidates[0] ?? null,
    candidates,
    evidence
  };
}

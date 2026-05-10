import { parse } from "tldts";
import { normalizeDomain } from "@/lib/cache";

const SUSPICIOUS_SUBDOMAIN_TERMS = [
  "billing",
  "login",
  "secure",
  "verify",
  "account",
  "payment",
  "meta",
  "support"
] as const;

export type ParsedDomainParts = {
  inputHostname: string;
  normalizedHostname: string;
  registrableDomain: string;
  subdomain: string | null;
  isSubdomain: boolean;
  hostnameParts: string[];
  subdomainParts: string[];
  suspiciousSubdomainTerms: string[];
};

export function parseDomainParts(input: string): ParsedDomainParts {
  const normalizedHostname = normalizeDomain(input);
  const parsed = parse(normalizedHostname, { allowPrivateDomains: true });
  const registrableDomain = parsed.domain ?? normalizedHostname;
  const hostnameParts = normalizedHostname.split(".").filter(Boolean);

  let subdomain: string | null = null;
  if (parsed.subdomain && parsed.subdomain.trim().length > 0) {
    subdomain = parsed.subdomain.trim().toLowerCase();
  } else if (normalizedHostname !== registrableDomain && normalizedHostname.endsWith(`.${registrableDomain}`)) {
    subdomain = normalizedHostname.slice(0, -(registrableDomain.length + 1));
  }

  const subdomainParts = subdomain ? subdomain.split(".").filter(Boolean) : [];
  const suspiciousSubdomainTerms = subdomainParts.filter((part) =>
    SUSPICIOUS_SUBDOMAIN_TERMS.some((term) => part.includes(term))
  );

  return {
    inputHostname: input.trim(),
    normalizedHostname,
    registrableDomain,
    subdomain,
    isSubdomain: Boolean(subdomain),
    hostnameParts,
    subdomainParts,
    suspiciousSubdomainTerms: [...new Set(suspiciousSubdomainTerms)]
  };
}


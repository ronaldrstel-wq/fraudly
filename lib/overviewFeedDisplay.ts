/**
 * Domain-first primary line for compact feed rows; keeps full raw value for title/aria.
 */
export function overviewFeedPrimaryLine(raw: string): { primary: string; fullTitle: string } {
  const v = raw.trim();
  if (!v) return { primary: "", fullTitle: "" };

  if (/^https?:\/\//i.test(v)) {
    try {
      const url = new URL(v);
      return { primary: url.hostname, fullTitle: v };
    } catch {
      return { primary: v, fullTitle: v };
    }
  }

  // Host-shaped tokens (no whitespace), e.g. example.com or subdomain.host.tld/path
  if (!/\s/.test(v)) {
    try {
      const url = new URL(v.includes("://") ? v : `https://${v}`);
      if (url.hostname.includes(".")) {
        return { primary: url.hostname, fullTitle: v };
      }
    } catch {
      /* fall through */
    }
  }

  return { primary: v, fullTitle: v };
}

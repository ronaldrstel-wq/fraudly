import { normalizeDomain } from "@/lib/cache";
import { fetchWithTimeout, withCache, enforceRateLimit, type PublicIntelResult } from "@/lib/public-intel/shared";

type RedditPost = { title?: string; selftext?: string; created_utc?: number };
type RedditResponse = { data?: { children?: Array<{ data?: RedditPost }> } };

export type RedditIntel = {
  postCount: number;
  scamMentions: number;
  phishingMentions: number;
  complaintMentions: number;
  sentimentHint: "negative" | "mixed" | "neutral";
};

const SOURCE = "Reddit (public JSON)";

export async function collectReddit(domain: string): Promise<PublicIntelResult<RedditIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:reddit:${normalized}`, async () => {
    try {
      enforceRateLimit("reddit", 600);
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(normalized)}&limit=25&sort=new`;
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        return { ok: false, source: SOURCE, data: null, warning: `HTTP ${response.status}` };
      }
      const json = (await response.json()) as RedditResponse;
      const posts = (json.data?.children ?? []).map((c) => c.data ?? {});
      const text = posts.map((p) => `${p.title ?? ""} ${p.selftext ?? ""}`.toLowerCase());
      const count = (rx: RegExp) => text.filter((line) => rx.test(line)).length;
      const scamMentions = count(/\bscam|fraud|rip.?off\b/i);
      const phishingMentions = count(/\bphish|credential|password reset\b/i);
      const complaintMentions = count(/\bcomplaint|chargeback|never arrived|not delivered\b/i);
      const negativeTotal = scamMentions + phishingMentions + complaintMentions;
      const sentimentHint: RedditIntel["sentimentHint"] =
        negativeTotal >= 6 ? "negative" : negativeTotal >= 2 ? "mixed" : "neutral";
      return {
        ok: true,
        source: SOURCE,
        data: {
          postCount: posts.length,
          scamMentions,
          phishingMentions,
          complaintMentions,
          sentimentHint
        }
      };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "Reddit fetch failed" };
    }
  });
}

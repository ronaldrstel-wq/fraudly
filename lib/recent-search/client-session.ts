/**
 * Browser-only helpers for anonymous recent-search correlation (paired with server httpOnly cookie).
 */

import { RECENT_SEARCH_LOCAL_STORAGE_KEY } from "@/lib/recent-search/constants";

export function getOrCreateAnonRecentSessionEcho(): string | null {
  if (typeof window === "undefined") return null;

  try {
    let raw = window.localStorage.getItem(RECENT_SEARCH_LOCAL_STORAGE_KEY);
    if (raw?.trim()) {
      const t = raw.trim();
      if (/^[\da-f-]{36}$/i.test(t)) return t.toLowerCase();
      window.localStorage.removeItem(RECENT_SEARCH_LOCAL_STORAGE_KEY);
    }
    const id = crypto.randomUUID();
    window.localStorage.setItem(RECENT_SEARCH_LOCAL_STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}

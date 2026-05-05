const ANON_FREE_CHECK_STORAGE_KEY = "fraudly_free_check_used";
const ANON_FREE_CHECK_COOKIE = "fraudly_free_check_used";

interface AccessUserLike {
  id?: string;
}

interface AccessSessionLike {
  hasUsedAnonymousFreeCheck: boolean;
}

export function getAnonymousFreeCheckStorageKey() {
  return ANON_FREE_CHECK_STORAGE_KEY;
}

export function getAnonymousFreeCheckCookieName() {
  return ANON_FREE_CHECK_COOKIE;
}

export function hasUsedAnonymousFreeCheck(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ANON_FREE_CHECK_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markAnonymousFreeCheckUsed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANON_FREE_CHECK_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures (private mode, blocked storage).
  }
}

export function hasUsedAnonymousFreeCheckCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${ANON_FREE_CHECK_COOKIE}=true`);
}

export function canRunCheck(user: AccessUserLike | null, session: AccessSessionLike): boolean {
  if (user?.id) return true;
  return !session.hasUsedAnonymousFreeCheck;
}

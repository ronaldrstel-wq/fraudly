/** HttpOnly cookie: opaque anonymous recent-search bucket (never a Clerk/User id). */
export const RECENT_SEARCH_SESSION_COOKIE = "fraudly_recent_session";

/** Client-visible UUID backup so anonymous history survives cookie clears in some setups (same-origin only). */
export const RECENT_SEARCH_LOCAL_STORAGE_KEY = "fraudly_recent_session_echo";

export const CLEAR_ALL_CONFIRM_BODY = "CLEAR_ALL_HISTORY";

/** Skip duplicate inserts for the same query within this window after a scan. */
export const RECENT_SEARCH_DEDUPE_MS = 12_000;

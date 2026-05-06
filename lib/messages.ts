/**
 * Shared client-safe English strings.
 * For fuller UI copy see `lib/messages.en.ts` and `lib/uiCopy.ts`.
 */

/** Generic copy for unexpected API / network failures (not validation or 429). */
export const GENERIC_CHECK_ERROR = "Something went wrong. Please try again.";

/** @deprecated Prefer EN_MESSAGES.check.invalidWebsiteInput — kept for rare imports. */
export const INVALID_URL_MESSAGE =
  "That doesn’t look like a website we can check. Enter a domain (like example.com), a full https link, or a path like example.com/login.";

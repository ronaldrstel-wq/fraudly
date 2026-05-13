/** Trimmed Clerk publishable key from env (server and client). */
export function readClerkPublishableKey(): string {
  const raw = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return typeof raw === "string" ? raw.trim() : "";
}

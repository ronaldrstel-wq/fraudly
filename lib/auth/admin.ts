import { auth, currentUser } from "@clerk/nextjs/server";

export class AdminAuthError extends Error {
  override name = "AdminAuthError";
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function parseCsvEnv(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getAdminEmails(): Set<string> {
  return parseCsvEnv(process.env.ADMIN_EMAILS);
}

export function isAdminEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getAdminEmails().has(normalized);
}

export async function getAdminIdentityOrNull(): Promise<{ userId: string; email: string | null } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = normalizeEmail(user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null);
  return { userId, email };
}

export async function getCurrentUserIsAdmin(): Promise<boolean> {
  const identity = await getAdminIdentityOrNull();
  if (!identity) return false;
  const allowedUserIds = parseCsvEnv(process.env.ADMIN_USER_IDS);
  if (allowedUserIds.has(identity.userId.trim().toLowerCase())) return true;
  return isAdminEmail(identity.email);
}

// Backward-compatible alias names for existing imports.
export const isCurrentUserAdmin = getCurrentUserIsAdmin;

export async function requireAdmin(): Promise<void> {
  if (!(await getCurrentUserIsAdmin())) {
    throw new AdminAuthError("Admin access required");
  }
}

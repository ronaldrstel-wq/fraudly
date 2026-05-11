import { auth, currentUser } from "@clerk/nextjs/server";

export class AdminAuthError extends Error {
  override name = "AdminAuthError";
}

const DEFAULT_ADMIN_EMAILS = ["ronald.r.stel@gmail.com"];

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

function getConfiguredAdminEmails(): Set<string> {
  const emails = parseCsvEnv(process.env.ADMIN_EMAILS);
  for (const fallback of DEFAULT_ADMIN_EMAILS) {
    emails.add(fallback);
  }
  return emails;
}

function getConfiguredAdminUserIds(): Set<string> {
  return parseCsvEnv(process.env.ADMIN_USER_IDS);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getConfiguredAdminEmails().has(normalized);
}

export async function getAdminIdentityOrNull(): Promise<{ userId: string; email: string | null } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = normalizeEmail(
    user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      null
  );
  return { userId, email };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const identity = await getAdminIdentityOrNull();
  if (!identity) return false;
  const allowedUserIds = getConfiguredAdminUserIds();
  if (allowedUserIds.has(identity.userId.trim().toLowerCase())) return true;
  return isAdminEmail(identity.email);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isCurrentUserAdmin())) {
    throw new AdminAuthError("Admin access required");
  }
}

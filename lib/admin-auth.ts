import { auth, currentUser } from "@clerk/nextjs/server";

export class AdminAuthError extends Error {
  override name = "AdminAuthError";
}

function parseCsvEnv(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function getAdminIdentityOrNull(): Promise<{ userId: string; email: string | null } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ??
    user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ??
    null;
  return { userId, email };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const identity = await getAdminIdentityOrNull();
  if (!identity) return false;
  const allowedUserIds = parseCsvEnv(process.env.ADMIN_USER_IDS);
  const allowedEmails = parseCsvEnv(process.env.ADMIN_EMAILS);
  if (allowedUserIds.has(identity.userId.toLowerCase())) return true;
  if (identity.email && allowedEmails.has(identity.email)) return true;
  return false;
}

export async function requireAdmin(): Promise<void> {
  const ok = await isCurrentUserAdmin();
  if (!ok) throw new AdminAuthError("Admin access required");
}

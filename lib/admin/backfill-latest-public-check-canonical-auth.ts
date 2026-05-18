import { isAdminRecalcAuthorized } from "@/lib/admin/adminKeyAuth";
import { getCurrentUserIsAdmin } from "@/lib/auth/admin";

export async function isBackfillAdminAuthorized(request: Request): Promise<boolean> {
  try {
    if (await getCurrentUserIsAdmin()) return true;
  } catch {
    // fall through to admin key
  }
  return isAdminRecalcAuthorized(request);
}

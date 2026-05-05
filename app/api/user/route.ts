import { NextResponse } from "next/server";
import { toBillingSnapshot } from "@/lib/billing";
import { EN_MESSAGES } from "@/lib/messages.en";
import { AuthRequiredError, requireBillingUser } from "@/lib/user-store";

export async function GET() {
  try {
    const user = await requireBillingUser();
    return NextResponse.json({ billing: toBillingSnapshot(user) });
  } catch (e) {
    if (e instanceof AuthRequiredError) {
      return NextResponse.json({ error: "unauthorized", message: EN_MESSAGES.auth.loginForAccount }, { status: 401 });
    }
    throw e;
  }
}

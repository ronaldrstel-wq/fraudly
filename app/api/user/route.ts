import { NextResponse } from "next/server";
import { toBillingSnapshot } from "@/lib/billing";
import { AuthRequiredError, requireBillingUser } from "@/lib/user-store";

export async function GET() {
  try {
    const user = await requireBillingUser();
    return NextResponse.json({ billing: toBillingSnapshot(user) });
  } catch (e) {
    if (e instanceof AuthRequiredError) {
      return NextResponse.json({ error: "unauthorized", message: "Log in om je account te bekijken." }, { status: 401 });
    }
    throw e;
  }
}

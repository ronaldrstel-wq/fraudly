import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/checkout";
import type { CheckoutSku } from "@/lib/billing";
import { getOrCreateUser, getUserIdFromRequest } from "@/lib/user-store";

interface CheckoutBody {
  sku?: CheckoutSku;
}

const VALID_SKUS: CheckoutSku[] = ["single_check", "five_checks", "twenty_checks", "premium_monthly"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    if (!body?.sku || !VALID_SKUS.includes(body.sku)) {
      return NextResponse.json({ error: "invalid checkout sku" }, { status: 400 });
    }

    const userId = getUserIdFromRequest(request);
    const user = await getOrCreateUser(userId);
    const session = await createCheckoutSession(body.sku, user.id, user.stripeCustomerId);
    return NextResponse.json({ checkoutUrl: session.checkoutUrl });
  } catch (error) {
    console.error("[api/checkout]", error);
    return NextResponse.json({ error: "checkout_failed" }, { status: 400 });
  }
}

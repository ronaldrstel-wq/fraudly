import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createCheckoutSession } from "@/lib/checkout";
import type { CheckoutSku } from "@/lib/billing";
import { EN_MESSAGES } from "@/lib/messages.en";
import { isMonetizationEnabled } from "@/lib/monetization";
import { stripeKeyMode } from "@/lib/stripe";
import { AuthRequiredError, requireBillingUser } from "@/lib/user-store";

export const runtime = "nodejs";

interface CheckoutBody {
  purchaseType?: CheckoutSku;
  sku?: CheckoutSku;
}

const VALID_SKUS: CheckoutSku[] = ["single_check", "five_checks", "twenty_checks", "premium_monthly"];

export async function POST(request: Request) {
  try {
    if (!isMonetizationEnabled()) {
      return NextResponse.json({ error: EN_MESSAGES.checkout.temporarilyDisabled }, { status: 403 });
    }

    let user;
    try {
      user = await requireBillingUser();
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        return NextResponse.json({ error: EN_MESSAGES.checkout.unauthorized }, { status: 401 });
      }
      throw e;
    }

    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json({ error: EN_MESSAGES.checkout.invalidRequest }, { status: 400 });
    }

    const purchaseType = body?.purchaseType ?? body?.sku;
    if (!purchaseType || !VALID_SKUS.includes(purchaseType)) {
      return NextResponse.json({ error: EN_MESSAGES.checkout.invalidPurchaseType }, { status: 400 });
    }

    console.info("[api/checkout] Request accepted", {
      userId: user.id,
      purchaseType,
      hasStripeCustomerId: Boolean(user.stripeCustomerId),
      stripeKeyMode
    });

    const session = await createCheckoutSession(purchaseType, user.id, user.stripeCustomerId);
    console.info("[api/checkout] Returning checkout URL", {
      userId: user.id,
      purchaseType,
      sessionId: session.sessionId,
      livemode: session.livemode
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[api/checkout]", error);
    const msg = error instanceof Error ? error.message : "";
    let errorOut: string = EN_MESSAGES.checkout.genericFailure;
    if (msg === "Stripe is not configured") {
      errorOut = EN_MESSAGES.checkout.stripeNotConfigured;
    } else if (msg.startsWith("Missing NEXT_PUBLIC_APP_URL")) {
      errorOut = EN_MESSAGES.checkout.missingAppUrl;
    } else if (msg.startsWith("Missing Stripe price id")) {
      errorOut = EN_MESSAGES.checkout.missingPriceId;
    } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      if (error.code === "resource_missing" && (error.param === "line_items" || msg.includes("price"))) {
        errorOut = EN_MESSAGES.checkout.invalidStripePriceId;
      } else if (error.code === "url_invalid") {
        errorOut = EN_MESSAGES.checkout.invalidReturnUrl;
      }
    }
    return NextResponse.json({ error: errorOut }, { status: 400 });
  }
}

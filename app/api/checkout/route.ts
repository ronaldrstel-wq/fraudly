import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/checkout";
import type { CheckoutSku } from "@/lib/billing";
import { getOrCreateUser } from "@/lib/user-store";

interface CheckoutBody {
  purchaseType?: CheckoutSku;
  sku?: CheckoutSku;
}

const VALID_SKUS: CheckoutSku[] = ["single_check", "five_checks", "twenty_checks", "premium_monthly"];

function checkoutUserIdOrNull(request: Request): string | null {
  const fromHeader = request.headers.get("x-fraudly-user-id")?.trim();
  if (!fromHeader || fromHeader === "guest") return null;
  return fromHeader;
}

export async function POST(request: Request) {
  try {
    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
    }

    const purchaseType = body?.purchaseType ?? body?.sku;
    if (!purchaseType || !VALID_SKUS.includes(purchaseType)) {
      return NextResponse.json({ error: "Ongeldig betaalproduct." }, { status: 400 });
    }

    const userId = checkoutUserIdOrNull(request);
    if (!userId) {
      return NextResponse.json({ error: "Je moet ingelogd zijn om af te rekenen." }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    const session = await createCheckoutSession(purchaseType, user.id, user.stripeCustomerId);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[api/checkout]", error);
    const msg = error instanceof Error ? error.message : "";
    let errorOut = "Checkout mislukt. Probeer het later opnieuw.";
    if (msg === "Stripe is not configured") {
      errorOut = "Betalingen zijn nog niet geconfigureerd (Stripe).";
    } else if (msg.startsWith("Missing NEXT_PUBLIC_APP_URL")) {
      errorOut = "Serverconfiguratie ontbreekt. Neem contact op met support.";
    } else if (msg.startsWith("Missing Stripe price id")) {
      errorOut = "Dit product is tijdelijk niet beschikbaar.";
    }
    return NextResponse.json({ error: errorOut }, { status: 400 });
  }
}

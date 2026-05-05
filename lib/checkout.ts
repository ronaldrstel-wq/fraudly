import type { CheckoutSku } from "@/lib/billing";
import Stripe from "stripe";
import { stripe, stripeKeyMode } from "@/lib/stripe";

const PRICE_IDS: Record<CheckoutSku, string | undefined> = {
  single_check: process.env.STRIPE_PRICE_SINGLE_CHECK,
  five_checks: process.env.STRIPE_PRICE_FIVE_CHECKS,
  twenty_checks: process.env.STRIPE_PRICE_TWENTY_CHECKS,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY
};

const SKU_LABEL: Record<CheckoutSku, string> = {
  single_check: "Single check",
  five_checks: "Five checks",
  twenty_checks: "Twenty checks",
  premium_monthly: "Premium monthly"
};

const MODE_BY_SKU: Record<CheckoutSku, "payment" | "subscription"> = {
  single_check: "payment",
  five_checks: "payment",
  twenty_checks: "payment",
  premium_monthly: "subscription"
};

function normalizeAppUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function isMissingOrInvalidCustomerError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { type?: string; code?: string; message?: string };
  if (e.type !== "StripeInvalidRequestError") return false;
  if (e.code === "resource_missing") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("no such customer") || msg.includes("similar object exists in live mode");
}

function buildSessionPayload(
  sku: CheckoutSku,
  userId: string,
  customerId: string | null | undefined,
  appUrl: string
): Stripe.Checkout.SessionCreateParams {
  const mode = MODE_BY_SKU[sku];
  const priceId = PRICE_IDS[sku];
  if (!priceId) {
    throw new Error(`Missing Stripe price id for ${sku}`);
  }
  return {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/payment/cancel`,
    customer: customerId ?? undefined,
    metadata: {
      userId,
      purchaseType: sku
    },
    subscription_data:
      mode === "subscription"
        ? {
            metadata: {
              userId,
              purchaseType: "premium_monthly"
            }
          }
        : undefined
  };
}

export async function createCheckoutSession(
  sku: CheckoutSku,
  userId: string,
  customerId?: string | null
): Promise<{ url: string; sessionId: string; livemode: boolean }> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!rawAppUrl?.trim()) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }
  const appUrl = normalizeAppUrl(rawAppUrl.trim());

  const payload = buildSessionPayload(sku, userId, customerId, appUrl);
  console.info("[checkout] Creating Stripe session", {
    sku,
    userId,
    appUrl,
    hasCustomerId: Boolean(customerId),
    mode: MODE_BY_SKU[sku],
    stripeKeyMode
  });

  try {
    const session = await stripe.checkout.sessions.create(payload);
    if (!session.url) {
      throw new Error(`Stripe checkout url missing for ${SKU_LABEL[sku]}`);
    }
    console.info("[checkout] Stripe session created", {
      sessionId: session.id,
      livemode: session.livemode,
      mode: session.mode,
      paymentStatus: session.payment_status
    });
    return { url: session.url, sessionId: session.id, livemode: session.livemode };
  } catch (first) {
    if (customerId && isMissingOrInvalidCustomerError(first)) {
      console.warn("[checkout] Retrying without Stripe customer id (invalid or wrong mode)", { userId });
      const retryPayload = buildSessionPayload(sku, userId, null, appUrl);
      const session = await stripe.checkout.sessions.create(retryPayload);
      if (!session.url) {
        throw new Error(`Stripe checkout url missing for ${SKU_LABEL[sku]}`);
      }
      console.info("[checkout] Stripe session created (retry without customer)", {
        sessionId: session.id,
        livemode: session.livemode,
        mode: session.mode,
        paymentStatus: session.payment_status
      });
      return { url: session.url, sessionId: session.id, livemode: session.livemode };
    }
    throw first;
  }
}

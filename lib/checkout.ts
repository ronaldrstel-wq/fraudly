import type { CheckoutSku } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

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

export async function createCheckoutSession(
  sku: CheckoutSku,
  userId: string,
  customerId?: string | null
): Promise<{ checkoutUrl: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  const priceId = PRICE_IDS[sku];
  if (!priceId) {
    throw new Error(`Missing Stripe price id for ${sku}`);
  }

  const mode = MODE_BY_SKU[sku];
  const session = await stripe.checkout.sessions.create({
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
  });

  if (!session.url) {
    throw new Error(`Stripe checkout url missing for ${SKU_LABEL[sku]}`);
  }
  return { checkoutUrl: session.url };
}

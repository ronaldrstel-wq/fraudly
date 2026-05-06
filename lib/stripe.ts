import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.warn("[stripe] STRIPE_SECRET_KEY is missing");
}

export const stripeKeyMode = key?.startsWith("sk_live_") ? "live" : key?.startsWith("sk_test_") ? "test" : "unknown";

export const stripe = key
  ? new Stripe(key, {
      apiVersion: "2026-04-22.dahlia"
    })
  : null;

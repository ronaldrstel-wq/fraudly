import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.warn("[stripe] STRIPE_SECRET_KEY is missing");
}

export const stripe = key
  ? new Stripe(key, {
      apiVersion: "2026-04-22.dahlia"
    })
  : null;

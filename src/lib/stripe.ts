import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY not set — Stripe features disabled.");
}

export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia" as any,
        typescript: true,
    })
    : null;

/**
 * Price IDs — set these in your Stripe dashboard and add to env:
 *   STRIPE_PRICE_PRO_MONTHLY=price_xxx
 *   STRIPE_PRICE_TEAM_MONTHLY=price_xxx
 */
export const PRICE_IDS = {
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    team: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
};

export function isStripeEnabled(): boolean {
    return stripe !== null;
}

import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeEnabled } from "@/lib/stripe";

export async function POST(request: NextRequest) {
    if (!isStripeEnabled() || !stripe) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    let event;
    try {
        const body = await request.text();
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as any;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                if (userId && plan) {
                    // Update user subscription in Supabase
                    const { createClient } = await import("@/lib/supabase/server");
                    const supabase = await createClient();

                    await supabase.from("user_subscriptions").upsert(
                        {
                            user_id: userId,
                            plan,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            status: "active",
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" }
                    );
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as any;
                const customerId = subscription.customer;
                const status = subscription.status;

                const { createClient } = await import("@/lib/supabase/server");
                const supabase = await createClient();

                await supabase
                    .from("user_subscriptions")
                    .update({
                        status,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as any;
                const customerId = subscription.customer;

                const { createClient } = await import("@/lib/supabase/server");
                const supabase = await createClient();

                await supabase
                    .from("user_subscriptions")
                    .update({
                        status: "cancelled",
                        plan: "free",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            default:
                // Unhandled event type
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook handler error:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}

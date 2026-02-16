import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_IDS, isStripeEnabled } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    if (!isStripeEnabled() || !stripe) {
        return NextResponse.json(
            { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable billing." },
            { status: 503 }
        );
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { plan } = await request.json();

        if (!plan || !["pro", "team"].includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan. Choose 'pro' or 'team'." },
                { status: 400 }
            );
        }

        const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
        if (!priceId) {
            return NextResponse.json(
                { error: `Price ID for ${plan} not configured.` },
                { status: 503 }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer_email: user.email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${appUrl}/dashboard?checkout=success`,
            cancel_url: `${appUrl}/pricing?checkout=cancelled`,
            metadata: {
                userId: user.id,
                plan,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}

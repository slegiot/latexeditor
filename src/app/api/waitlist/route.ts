import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        // Store in Supabase (optional — silently skip if table doesn't exist)
        try {
            const { createClient } = await import("@/lib/supabase/server");
            const supabase = await createClient();

            await supabase.from("waitlist").upsert(
                { email: email.toLowerCase().trim(), created_at: new Date().toISOString() },
                { onConflict: "email" }
            );
        } catch {
            // Supabase not configured or table missing — continue
        }

        // Send welcome email via Resend
        if (resend) {
            try {
                await resend.emails.send({
                    from: "LatexForge <hello@latexforge.dev>",
                    to: email,
                    subject: "Welcome to the LatexForge waitlist! 🎉",
                    html: `
                        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
                                You're on the list! ✨
                            </h1>
                            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
                                Thanks for joining the LatexForge waitlist. We'll let you know as soon as
                                our AI-powered features are ready for you to try.
                            </p>
                            <p style="color: #6b7280; line-height: 1.6;">
                                In the meantime, you can already
                                <a href="https://latexforge.dev/signup" style="color: #10B981; text-decoration: underline;">
                                    sign up for free
                                </a>
                                and start writing LaTeX with real-time collaboration.
                            </p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                            <p style="color: #9ca3af; font-size: 12px;">
                                LatexForge — Write LaTeX with AI Superpowers
                            </p>
                        </div>
                    `,
                });
            } catch (emailErr) {
                console.error("Resend error:", emailErr);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            message: "You're on the list! We'll be in touch soon.",
        });
    } catch {
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

import { NextRequest } from "next/server";
import { fixLatexErrors, generateFromPrompt } from "@/lib/ai-service";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getUserLimits, checkDailyAiLimit } from "@/lib/plan-limits";

export async function POST(request: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Per-minute burst guard
    const rl = rateLimit(`ai:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
        return new Response(
            JSON.stringify({
                error: "Too many requests. Please wait a moment.",
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
                },
            }
        );
    }

    // Plan-based daily AI limit
    const limits = await getUserLimits(user.id);
    const dailyCheck = checkDailyAiLimit(user.id, limits.aiCallsPerDay);
    if (!dailyCheck.allowed) {
        return new Response(
            JSON.stringify({
                error: `Daily AI limit reached (${dailyCheck.limit} calls on ${limits.plan} plan). Upgrade to Pro for unlimited AI.`,
                plan: limits.plan,
                limit: dailyCheck.limit,
            }),
            {
                status: 429,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        const body = await request.json();
        const { action, content, errors, prompt } = body;

        let stream: ReadableStream<Uint8Array>;

        if (action === "fix") {
            if (!content || !errors || !Array.isArray(errors)) {
                return new Response(
                    JSON.stringify({ error: "Missing content or errors" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
            stream = await fixLatexErrors(content, errors);
        } else if (action === "generate") {
            if (!prompt || typeof prompt !== "string") {
                return new Response(
                    JSON.stringify({ error: "Missing prompt" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
            stream = await generateFromPrompt(prompt);
        } else {
            return new Response(
                JSON.stringify({ error: "Invalid action. Use 'fix' or 'generate'." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error: any) {
        console.error("AI API error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "AI service unavailable" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/github/callback?code=xxx&state=xxx
 * Exchanges OAuth code for access token, stores in Supabase.
 */
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code || !state) {
        return NextResponse.redirect(new URL("/dashboard?error=github_auth_failed", request.url));
    }

    // Validate CSRF state
    const cookieValue = request.cookies.get("github_oauth_state")?.value;
    if (!cookieValue) {
        return NextResponse.redirect(new URL("/dashboard?error=github_auth_expired", request.url));
    }

    let storedState: { state: string; projectId: string };
    try {
        storedState = JSON.parse(cookieValue);
    } catch {
        return NextResponse.redirect(new URL("/dashboard?error=github_auth_failed", request.url));
    }

    if (storedState.state !== state) {
        return NextResponse.redirect(new URL("/dashboard?error=github_csrf_mismatch", request.url));
    }

    // Exchange code for token
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL("/dashboard?error=github_not_configured", request.url));
    }

    try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return NextResponse.redirect(new URL("/dashboard?error=github_token_failed", request.url));
        }

        // Fetch GitHub username
        const userRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const githubUser = await userRes.json();

        // Store in Supabase
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Upsert github connection
        await supabase.from("github_connections").upsert(
            {
                user_id: user.id,
                github_username: githubUser.login,
                access_token: tokenData.access_token,
                token_scope: tokenData.scope || "repo",
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

        // Clear the OAuth cookie
        const redirectUrl = storedState.projectId
            ? `/editor/${storedState.projectId}?github=connected`
            : "/dashboard?github=connected";

        const response = NextResponse.redirect(new URL(redirectUrl, request.url));
        response.cookies.delete("github_oauth_state");
        return response;
    } catch (err) {
        console.error("GitHub OAuth error:", err);
        return NextResponse.redirect(new URL("/dashboard?error=github_auth_failed", request.url));
    }
}

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * GET /api/github/auth?projectId=xxx
 * Redirects to GitHub OAuth consent screen.
 */
export async function GET(request: NextRequest) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json(
            { error: "GitHub OAuth not configured. Set GITHUB_CLIENT_ID in .env.local" },
            { status: 500 }
        );
    }

    const projectId = request.nextUrl.searchParams.get("projectId") || "";
    const state = randomBytes(16).toString("hex");

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/github/callback`;

    const githubUrl = new URL("https://github.com/login/oauth/authorize");
    githubUrl.searchParams.set("client_id", clientId);
    githubUrl.searchParams.set("redirect_uri", callbackUrl);
    githubUrl.searchParams.set("scope", "repo");
    githubUrl.searchParams.set("state", state);

    // Store state + projectId in cookie for CSRF validation
    const response = NextResponse.redirect(githubUrl.toString());
    response.cookies.set("github_oauth_state", JSON.stringify({ state, projectId }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 600, // 10 minutes
        sameSite: "lax",
        path: "/",
    });

    return response;
}

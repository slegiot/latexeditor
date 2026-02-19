// ─────────────────────────────────────────────────────────────
// API Route: GET /api/health
// ─────────────────────────────────────────────────────────────
// Health check endpoint for Docker and load balancers.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'latexforge-web',
        timestamp: new Date().toISOString(),
    });
}

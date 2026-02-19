// ─────────────────────────────────────────────────────────────
// API Route: GET /api/compile/logs
// ─────────────────────────────────────────────────────────────
// Server-Sent Events endpoint for real-time compilation logs.
//
// Query params:
//   compilationId — The compilation record ID
//
// Events:
//   { type: 'log',    line: string, timestamp: number }
//   { type: 'status', status: string }
//   { type: 'done',   pdfUrl?: string, synctexUrl?: string, durationMs: number }
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export async function GET(request: NextRequest) {
    // ── Auth check ──────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // ── Parse params ────────────────────────────────────────
    const compilationId = request.nextUrl.searchParams.get('compilationId');
    if (!compilationId) {
        return new Response(JSON.stringify({ error: 'Missing compilationId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // ── Verify the user has access to this compilation ──────
    const { data: compilation, error: compError } = await supabase
        .from('compilations')
        .select('id, project_id')
        .eq('id', compilationId)
        .single();

    if (compError || !compilation) {
        return new Response(JSON.stringify({ error: 'Compilation not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // ── SSE stream via Redis Pub/Sub ────────────────────────
    const channel = `compile-logs:${compilationId}`;

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            const subscriber = new IORedis(REDIS_URL, {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
            });

            let closed = false;

            function send(data: string) {
                if (closed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch {
                    // Stream was closed
                    cleanup();
                }
            }

            function cleanup() {
                if (closed) return;
                closed = true;
                subscriber.unsubscribe(channel).catch(() => { });
                subscriber.quit().catch(() => { });
            }

            subscriber.subscribe(channel).then(() => {
                // Send an initial heartbeat
                send(JSON.stringify({ type: 'connected', compilationId }));
            }).catch((err: Error) => {
                send(JSON.stringify({ type: 'error', message: err.message }));
                cleanup();
            });

            subscriber.on('message', (_ch: string, message: string) => {
                send(message);

                // Close stream when compilation is done
                try {
                    const event = JSON.parse(message);
                    if (event.type === 'done') {
                        // Send one final event, then close after a short delay
                        setTimeout(() => {
                            try {
                                controller.close();
                            } catch { /* already closed */ }
                            cleanup();
                        }, 500);
                    }
                } catch {
                    // Non-JSON message, ignore
                }
            });

            // Heartbeat every 15s to keep the connection alive
            const heartbeat = setInterval(() => {
                if (closed) {
                    clearInterval(heartbeat);
                    return;
                }
                send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
            }, 15_000);

            // Auto-close after 5 minutes (compilation should be done by then)
            const timeout = setTimeout(() => {
                send(JSON.stringify({ type: 'timeout', message: 'SSE stream timed out' }));
                try { controller.close(); } catch { /* already closed */ }
                cleanup();
                clearInterval(heartbeat);
            }, 5 * 60 * 1000);

            // Cleanup on abort
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                clearTimeout(timeout);
                cleanup();
            });
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
}

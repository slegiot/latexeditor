// ─────────────────────────────────────────────────────────────
// LaTeXForge — Hocuspocus Collaboration Server
// ─────────────────────────────────────────────────────────────
// Standalone WebSocket server for real-time collaborative editing.
// Uses Hocuspocus (built on Yjs) with custom extensions for:
//   - Supabase DB persistence (load/store document state)
//   - JWT authentication (verify Supabase tokens)
//   - Connection logging
//
// Run: npm run collab        (dev)
//      node dist/collaboration/server.js  (prod)
// ─────────────────────────────────────────────────────────────

import { Hocuspocus } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { createSupabasePersistence } from './persistence';
import { createAuthExtension } from './auth';

const PORT = parseInt(process.env.WS_PORT || '4444', 10);

// ── Server Configuration ─────────────────────────────────────

const server = new Hocuspocus({
    port: PORT,
    address: '0.0.0.0',

    // ── Extensions ─────────────────────────────────────────────
    extensions: [
        // Structured logging
        new Logger({
            onLoadDocument: true,
            onChange: false,    // Too noisy for per-keystroke
            onStoreDocument: true,
            onConnect: true,
            onDisconnect: true,
        }),

        // Supabase DB persistence
        createSupabasePersistence(),

        // JWT authentication
        createAuthExtension(),
    ],

    // ── Debounce ───────────────────────────────────────────────
    // Wait 2s of inactivity before persisting (batches rapid edits)
    debounce: 2000,

    // Max wait before force-persisting even if edits continue
    maxDebounce: 10000,

    // ── Lifecycle Hooks ────────────────────────────────────────

    async onConnect(data) {
        const { documentName, requestParameters } = data;
        const userId = data.context?.userId;

        console.log(
            `[Collab] User ${userId || 'anonymous'} connecting to "${documentName}"` +
            ` (${data.socketId})`
        );

        // Parse room name: "latexforge:{projectId}:{filePath}"
        const parts = documentName.split(':');
        if (parts.length < 3 || parts[0] !== 'latexforge') {
            throw new Error(`Invalid document name format: "${documentName}"`);
        }
    },

    async onDisconnect(data) {
        const userId = data.context?.userId;
        console.log(
            `[Collab] User ${userId || 'anonymous'} disconnected from "${data.documentName}"` +
            ` (${data.socketId})`
        );
    },

    // ── Awareness ──────────────────────────────────────────────
    // Awareness state is handled client-side via the Yjs awareness
    // protocol. Hocuspocus automatically relays awareness updates
    // (cursor positions, user names, colors) to all connected peers.
    // No server-side config needed — it's built into the protocol.
});

// ── Start Server ─────────────────────────────────────────────

server.listen().then(() => {
    console.log(`[Collab] Hocuspocus server listening on ws://0.0.0.0:${PORT}`);
    console.log(`[Collab] Persistence: Supabase (debounce: ${server.configuration.debounce}ms)`);
});

// ── Graceful Shutdown ────────────────────────────────────────

async function shutdown() {
    console.log('[Collab] Shutting down gracefully...');
    await server.destroy();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server };

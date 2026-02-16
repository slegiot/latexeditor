/**
 * LatexForge — Yjs WebSocket Collaboration Server
 *
 * Standalone server that syncs Yjs documents between clients.
 * Auth: verifies Supabase JWT on connection.
 * Persistence: periodically saves Yjs doc → Supabase documents table.
 *
 * Usage: node server/ws-server.mjs
 * Port:  4444 (WS_PORT env override)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { WebSocketServer } from "ws";
import http from "http";
import { createClient } from "@supabase/supabase-js";
import { setupWSConnection, getYDoc } from "y-websocket/bin/utils";

// ── Load .env.local ─────────────────────────────────
try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envFile = readFileSync(envPath, "utf-8");
    for (const line of envFile.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
    console.log("📄 Loaded .env.local");
} catch {
    console.log("⚠️  No .env.local found, using existing environment variables");
}

// ── Config ──────────────────────────────────────────
const PORT = parseInt(process.env.WS_PORT || "4444", 10);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SAVE_INTERVAL_MS = 30_000; // 30 seconds

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    console.error("   Set them in .env.local or export as environment variables.");
    process.exit(1);
}

// ── Supabase client (service-level for persistence) ─
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── JWT Verification ────────────────────────────────
async function verifyToken(token) {
    if (!token) return null;
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch {
        return null;
    }
}

// ── Persistence ─────────────────────────────────────
// Track which project IDs have active docs
const activeRooms = new Map(); // roomName → { projectId, intervalId }

function startPersistence(roomName) {
    if (activeRooms.has(roomName)) return;

    // Room name format: "project:{projectId}"
    const projectId = roomName.replace("project:", "");
    if (!projectId || projectId === roomName) return;

    const intervalId = setInterval(async () => {
        try {
            const doc = getYDoc(roomName);
            if (!doc) return;

            const yText = doc.getText("content");
            const content = yText.toString();

            if (!content || content.length === 0) return;

            // Save to Supabase documents table
            const { data: existingDoc } = await supabase
                .from("documents")
                .select("id")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true })
                .limit(1)
                .single();

            if (existingDoc) {
                await supabase
                    .from("documents")
                    .update({
                        content,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingDoc.id);
            } else {
                await supabase.from("documents").insert({
                    project_id: projectId,
                    title: "main.tex",
                    content,
                });
            }

            // Also update project timestamp
            await supabase
                .from("projects")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", projectId);

            console.log(`💾 Saved room ${roomName} (${content.length} chars)`);
        } catch (err) {
            console.error(`❌ Persistence error for ${roomName}:`, err.message);
        }
    }, SAVE_INTERVAL_MS);

    activeRooms.set(roomName, { projectId, intervalId });
    console.log(`📌 Started persistence for ${roomName}`);
}

function stopPersistence(roomName) {
    const entry = activeRooms.get(roomName);
    if (entry) {
        clearInterval(entry.intervalId);
        activeRooms.delete(roomName);
        console.log(`📌 Stopped persistence for ${roomName}`);
    }
}

// ── HTTP + WebSocket Server ─────────────────────────
const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        service: "LatexForge Yjs Collaboration Server",
        status: "running",
        activeRooms: activeRooms.size,
        port: PORT,
    }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", async (ws, req) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const token = url.searchParams.get("token");
    const roomName = url.pathname.slice(1) || "default"; // e.g. "/project:abc123" → "project:abc123"

    // ── Auth ──
    const user = await verifyToken(token);
    if (!user) {
        console.log(`🚫 Rejected unauthenticated connection to ${roomName}`);
        ws.close(4401, "Unauthorized");
        return;
    }

    console.log(`✅ ${user.email} connected to ${roomName}`);

    // ── Initialise Yjs doc with content from Supabase if empty ─
    const projectId = roomName.replace("project:", "");
    const doc = getYDoc(roomName);
    const yText = doc.getText("content");

    if (yText.length === 0 && projectId !== roomName) {
        try {
            const { data: existingDoc } = await supabase
                .from("documents")
                .select("content")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true })
                .limit(1)
                .single();

            if (existingDoc?.content) {
                doc.transact(() => {
                    yText.insert(0, existingDoc.content);
                });
                console.log(`📄 Loaded ${existingDoc.content.length} chars from DB for ${roomName}`);
            }
        } catch (err) {
            console.error(`⚠️  Could not load doc for ${roomName}:`, err.message);
        }
    }

    // ── Start persistence ──
    startPersistence(roomName);

    // ── Setup Yjs WS connection ──
    setupWSConnection(ws, req, { docName: roomName });

    ws.on("close", () => {
        console.log(`👋 ${user.email} disconnected from ${roomName}`);

        // Check if room is now empty
        const clients = [...wss.clients].filter((c) => c.readyState === 1);
        // Simple heuristic: if very few clients, check again after a delay
        setTimeout(() => {
            const remaining = [...wss.clients].filter((c) => c.readyState === 1);
            if (remaining.length === 0) {
                stopPersistence(roomName);
            }
        }, 5000);
    });
});

// ── Start ───────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`\n🔗 LatexForge Yjs server listening on ws://localhost:${PORT}`);
    console.log(`   Supabase: ${SUPABASE_URL}`);
    console.log(`   Save interval: ${SAVE_INTERVAL_MS / 1000}s\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down Yjs server...");
    for (const [roomName] of activeRooms) {
        stopPersistence(roomName);
    }
    server.close();
    process.exit(0);
});

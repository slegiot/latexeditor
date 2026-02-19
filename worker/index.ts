// ─────────────────────────────────────────────────────────────
// LaTeXForge — BullMQ Worker Entrypoint (Production)
// ─────────────────────────────────────────────────────────────
// Consumes latex-compile jobs from Redis and orchestrates
// the full compilation lifecycle:
//   1. Update DB status → 'compiling'
//   2. Run sandboxed Docker compilation
//   3. Stream logs in real-time via Redis Pub/Sub
//   4. Upload PDF + SyncTeX to Supabase Storage
//   5. Update DB with final status, URLs, and log
// ─────────────────────────────────────────────────────────────

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runSandboxCompilation } from './sandbox';
import type { SandboxInput, SandboxResult } from './sandbox';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'latex-compile';

// ── Job Data (matches CompileJobData from shared types) ──────

interface CompileJobData {
    compilationId: string;
    projectId: string;
    engine: string;
    files: Array<{
        path: string;
        content: string;
        is_entrypoint: boolean;
    }>;
    assets: Array<{
        path: string;
        storage_key: string;
    }>;
}

interface CompileJobResult {
    status: 'success' | 'error' | 'timeout';
    pdfUrl?: string;
    synctexUrl?: string;
    log: string;
    durationMs: number;
}

// ── Redis Connection ─────────────────────────────────────────

const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// ── Worker ───────────────────────────────────────────────────

const worker = new Worker<CompileJobData, CompileJobResult>(
    QUEUE_NAME,
    async (job: Job<CompileJobData, CompileJobResult>) => {
        console.log(
            `[Worker] Processing job ${job.id} — project ${job.data.projectId} ` +
            `(${job.data.files.length} files, ${job.data.assets?.length || 0} assets)`
        );

        // Build sandbox input
        const sandboxInput: SandboxInput = {
            compilationId: job.data.compilationId,
            projectId: job.data.projectId,
            engine: job.data.engine,
            files: job.data.files,
            assets: job.data.assets || [],
        };

        // The sandbox handles:
        //   - DB status updates (compiling → success/error/timeout)
        //   - Real-time log streaming via Redis Pub/Sub
        //   - PDF + SyncTeX upload to Supabase Storage
        //   - Full log capture and DB persistence
        const result: SandboxResult = await runSandboxCompilation(sandboxInput);

        console.log(
            `[Worker] Job ${job.id} completed — ${result.status} ` +
            `(${result.durationMs}ms, pdf=${!!result.pdfUrl}, synctex=${!!result.synctexUrl})`
        );

        return {
            status: result.status,
            pdfUrl: result.pdfUrl,
            synctexUrl: result.synctexUrl,
            log: result.log,
            durationMs: result.durationMs,
        };
    },
    {
        connection: connection as any,
        concurrency: 3,          // Max parallel compilations
        limiter: {
            max: 10,
            duration: 60_000,    // 10 jobs per minute
        },
    }
);

// ── Lifecycle Events ─────────────────────────────────────────

worker.on('completed', (job, result) => {
    console.log(`[Worker] ✓ Job ${job.id} → ${result.status} (${result.durationMs}ms)`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err.message);
});

worker.on('stalled', (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled`);
});

// ── Graceful Shutdown ────────────────────────────────────────

async function shutdown() {
    console.log('[Worker] Shutting down gracefully...');
    await worker.close();
    await connection.quit();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`[Worker] Listening for jobs on queue "${QUEUE_NAME}"...`);

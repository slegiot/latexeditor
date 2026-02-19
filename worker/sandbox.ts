// ─────────────────────────────────────────────────────────────
// LaTeXForge — Docker Sandbox Orchestrator (Production)
// ─────────────────────────────────────────────────────────────
// Spawns an ephemeral TeX Live container for each compilation.
//
// Key capabilities:
//   1. Writes .tex/.bib files from DB & downloads binary assets
//   2. Runs latexmk -pdf -synctex=1 in a hardened container
//   3. Streams log output in real-time via Redis Pub/Sub
//   4. Uploads PDF + .synctex.gz to Supabase Storage
//   5. Updates compilation record in the database
// ─────────────────────────────────────────────────────────────

import Docker from 'dockerode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import IORedis from 'ioredis';

const gunzip = promisify(zlib.gunzip);

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const TEXLIVE_IMAGE = 'latexforge-texlive:latest';
const COMPILE_TIMEOUT_MS = 90_000;
const WORKSPACE_BASE = process.env.COMPILE_WORKSPACE || path.join(os.tmpdir(), 'latex-compile');

// Service-role Supabase client (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Redis for log streaming pub/sub
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const ASSET_BUCKET = 'project-assets';
const COMPILE_BUCKET = 'compilations';

// ── Types ────────────────────────────────────────────────────

export interface SandboxInput {
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

export interface SandboxResult {
    status: 'success' | 'error' | 'timeout';
    pdfUrl?: string;
    synctexUrl?: string;
    log: string;
    durationMs: number;
}

// ── Log Streaming ────────────────────────────────────────────

/** Publish a log line to Redis for SSE consumers */
function publishLog(compilationId: string, line: string): void {
    const event = JSON.stringify({
        type: 'log',
        line,
        timestamp: Date.now(),
    });
    redis.publish(`compile-logs:${compilationId}`, event).catch(() => { });
}

/** Publish a status change event */
function publishStatus(compilationId: string, status: string): void {
    const event = JSON.stringify({ type: 'status', status });
    redis.publish(`compile-logs:${compilationId}`, event).catch(() => { });
}

/** Publish a completion event */
function publishDone(
    compilationId: string,
    pdfUrl?: string,
    synctexUrl?: string,
    durationMs?: number
): void {
    const event = JSON.stringify({ type: 'done', pdfUrl, synctexUrl, durationMs });
    redis.publish(`compile-logs:${compilationId}`, event).catch(() => { });
}

// ── Asset Download ───────────────────────────────────────────

async function downloadAssetToDisk(storageKey: string, destPath: string): Promise<void> {
    const { data, error } = await supabaseAdmin.storage
        .from(ASSET_BUCKET)
        .download(storageKey);

    if (error || !data) {
        throw new Error(`Failed to download asset "${storageKey}": ${error?.message || 'no data'}`);
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    const arrayBuffer = await data.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(arrayBuffer));
}

// ── Supabase Upload ──────────────────────────────────────────

async function uploadCompilationArtifact(
    compilationId: string,
    filename: string,
    filePath: string,
    contentType: string
): Promise<string | null> {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const storageKey = `${compilationId}/${filename}`;

        const { error } = await supabaseAdmin.storage
            .from(COMPILE_BUCKET)
            .upload(storageKey, fileBuffer, {
                contentType,
                upsert: true,
            });

        if (error) {
            console.error(`[Sandbox] Upload failed for ${filename}:`, error.message);
            return null;
        }

        // Generate a signed URL (valid for 1 hour)
        const { data } = await supabaseAdmin.storage
            .from(COMPILE_BUCKET)
            .createSignedUrl(storageKey, 3600);

        return data?.signedUrl || null;
    } catch (err) {
        console.error(`[Sandbox] Upload error for ${filename}:`, err);
        return null;
    }
}

// ── Database Updates ─────────────────────────────────────────

async function updateCompilationStatus(
    compilationId: string,
    updates: {
        status: string;
        pdf_url?: string | null;
        synctex_url?: string | null;
        log?: string | null;
        duration_ms?: number | null;
    }
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('compilations')
        .update(updates)
        .eq('id', compilationId);

    if (error) {
        console.error(`[Sandbox] DB update failed for ${compilationId}:`, error.message);
    }
}

// ── Main Compilation ─────────────────────────────────────────

export async function runSandboxCompilation(input: SandboxInput): Promise<SandboxResult> {
    const startTime = Date.now();
    const workDir = path.join(WORKSPACE_BASE, input.compilationId);
    const sourceDir = path.join(workDir, 'source');
    const outputDir = path.join(workDir, 'output');

    let container: Docker.Container | null = null;

    try {
        // ── 1. Mark as compiling ───────────────────────────────
        await updateCompilationStatus(input.compilationId, { status: 'compiling' });
        publishStatus(input.compilationId, 'compiling');

        // ── 2. Write source files ──────────────────────────────
        await fs.mkdir(sourceDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });

        let entrypointFile = 'main.tex';

        for (const file of input.files) {
            const filePath = path.join(sourceDir, file.path);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content, 'utf-8');

            if (file.is_entrypoint) {
                entrypointFile = file.path;
            }
        }

        // ── 3. Download binary assets ──────────────────────────
        if (input.assets && input.assets.length > 0) {
            publishLog(input.compilationId, `Downloading ${input.assets.length} asset(s)...`);

            const downloadResults = await Promise.allSettled(
                input.assets.map(async (asset) => {
                    const destPath = path.join(sourceDir, asset.path);
                    await downloadAssetToDisk(asset.storage_key, destPath);
                    return asset.path;
                })
            );

            let successCount = 0;
            for (const result of downloadResults) {
                if (result.status === 'rejected') {
                    publishLog(input.compilationId, `⚠ Asset warning: ${result.reason}`);
                } else {
                    successCount++;
                }
            }
            publishLog(input.compilationId, `Downloaded ${successCount}/${input.assets.length} assets`);
        }

        // ── 4. Create and start container ──────────────────────
        publishLog(input.compilationId, `Starting compilation (${input.engine})...`);

        container = await docker.createContainer({
            Image: TEXLIVE_IMAGE,
            Cmd: [entrypointFile],
            HostConfig: {
                Binds: [
                    `${sourceDir}:/work/source:rw`, // rw: latexmk writes aux files here
                    `${outputDir}:/work/output:rw`,
                ],
                NetworkMode: 'none',
                ReadonlyRootfs: true,
                Memory: 512 * 1024 * 1024,
                NanoCpus: 1_000_000_000,
                PidsLimit: 100,
                SecurityOpt: ['no-new-privileges:true'],
                CapDrop: ['ALL'],
                Tmpfs: {
                    '/tmp': 'size=50M',
                },
            },
            WorkingDir: '/work',
        });

        await container.start();

        // ── 5. Stream logs in real-time ────────────────────────
        const logChunks: string[] = [];

        const logStream = await container.logs({
            stdout: true,
            stderr: true,
            follow: true,
            timestamps: false,
        });

        // Docker multiplexed stream: parse frames
        logStream.on('data', (chunk: Buffer) => {
            // Strip Docker multiplexed stream header (8 bytes)
            const text = chunk.length > 8
                ? chunk.subarray(8).toString('utf-8')
                : chunk.toString('utf-8');

            for (const line of text.split('\n')) {
                const trimmed = line.trim();
                if (trimmed) {
                    logChunks.push(trimmed);
                    publishLog(input.compilationId, trimmed);
                }
            }
        });

        // ── 6. Wait for completion with timeout ────────────────
        const waitResult = await Promise.race([
            container.wait(),
            new Promise<{ StatusCode: number }>((_, reject) =>
                setTimeout(() => reject(new Error('Container timeout')), COMPILE_TIMEOUT_MS)
            ),
        ]);

        const durationMs = Date.now() - startTime;
        const fullLog = logChunks.join('\n');

        // ── 7. Process result ──────────────────────────────────
        if (waitResult.StatusCode === 0) {
            const outputFiles = await fs.readdir(outputDir);
            const pdfFile = outputFiles.find((f) => f.endsWith('.pdf'));
            const synctexFile = outputFiles.find((f) => f.endsWith('.synctex.gz'));

            if (pdfFile) {
                const pdfPath = path.join(outputDir, pdfFile);

                // Upload PDF to Supabase Storage
                publishLog(input.compilationId, 'Uploading PDF to storage...');
                const pdfUrl = await uploadCompilationArtifact(
                    input.compilationId, 'output.pdf', pdfPath, 'application/pdf'
                );

                // Upload SyncTeX if available
                let synctexUrl: string | null = null;
                if (synctexFile) {
                    const synctexPath = path.join(outputDir, synctexFile);

                    // Decompress .synctex.gz for the frontend parser
                    try {
                        const compressedData = await fs.readFile(synctexPath);
                        const decompressed = await gunzip(compressedData);
                        const synctexTextPath = synctexPath.replace('.gz', '');
                        await fs.writeFile(synctexTextPath, decompressed);

                        synctexUrl = await uploadCompilationArtifact(
                            input.compilationId, 'output.synctex', synctexTextPath, 'text/plain'
                        );
                    } catch (err) {
                        publishLog(input.compilationId, `⚠ SyncTeX decompression failed: ${err}`);
                    }
                }

                // Update DB
                await updateCompilationStatus(input.compilationId, {
                    status: 'success',
                    pdf_url: pdfUrl,
                    synctex_url: synctexUrl,
                    log: fullLog,
                    duration_ms: durationMs,
                });

                publishDone(input.compilationId, pdfUrl || undefined, synctexUrl || undefined, durationMs);

                return {
                    status: 'success',
                    pdfUrl: pdfUrl || undefined,
                    synctexUrl: synctexUrl || undefined,
                    log: fullLog,
                    durationMs,
                };
            }

            // No PDF produced despite exit 0
            await updateCompilationStatus(input.compilationId, {
                status: 'error',
                log: fullLog + '\n\nNo PDF file produced despite exit code 0.',
                duration_ms: durationMs,
            });

            publishDone(input.compilationId, undefined, undefined, durationMs);
            return {
                status: 'error',
                log: fullLog + '\n\nNo PDF file produced despite exit code 0.',
                durationMs,
            };
        } else if (waitResult.StatusCode === 3) {
            await updateCompilationStatus(input.compilationId, {
                status: 'timeout',
                log: fullLog,
                duration_ms: durationMs,
            });

            publishDone(input.compilationId, undefined, undefined, durationMs);
            return { status: 'timeout', log: fullLog, durationMs };
        } else {
            await updateCompilationStatus(input.compilationId, {
                status: 'error',
                log: fullLog,
                duration_ms: durationMs,
            });

            publishDone(input.compilationId, undefined, undefined, durationMs);
            return { status: 'error', log: fullLog, durationMs };
        }
    } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage === 'Container timeout') {
            if (container) {
                try { await container.kill(); } catch { /* already stopped */ }
            }

            await updateCompilationStatus(input.compilationId, {
                status: 'timeout',
                log: `Compilation timed out after ${COMPILE_TIMEOUT_MS / 1000}s`,
                duration_ms: durationMs,
            });

            publishDone(input.compilationId, undefined, undefined, durationMs);
            return {
                status: 'timeout',
                log: `Compilation timed out after ${COMPILE_TIMEOUT_MS / 1000}s`,
                durationMs,
            };
        }

        await updateCompilationStatus(input.compilationId, {
            status: 'error',
            log: `Sandbox error: ${errorMessage}`,
            duration_ms: durationMs,
        });

        publishDone(input.compilationId, undefined, undefined, durationMs);
        return {
            status: 'error',
            log: `Sandbox error: ${errorMessage}`,
            durationMs,
        };
    } finally {
        // ── Cleanup ─────────────────────────────────────────────
        if (container) {
            try { await container.remove({ force: true }); } catch { /* best-effort */ }
        }
        try { await fs.rm(workDir, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
}

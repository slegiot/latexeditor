// ─────────────────────────────────────────────────────────────
// Redis — Shared Connection
// ─────────────────────────────────────────────────────────────
// Supports both local Redis and Upstash Redis (TLS).
// Set REDIS_URL in .env.local to your connection string.
// ─────────────────────────────────────────────────────────────

import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/** Detect if the URL points to Upstash (requires TLS) */
function needsTls(url: string): boolean {
    return url.includes('upstash.io');
}

/** Build common ioredis options */
function buildOptions() {
    const opts: Record<string, unknown> = {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        retryStrategy(times: number) {
            return Math.min(times * 50, 2000);
        },
    };

    if (needsTls(REDIS_URL)) {
        opts.tls = {};  // Enable TLS for Upstash
    }

    return opts;
}

// Singleton connection for the web process
let redis: IORedis | null = null;

export function getRedis(): IORedis {
    if (!redis) {
        redis = new IORedis(REDIS_URL, buildOptions());
    }
    return redis;
}

// Create a new connection (for BullMQ workers — each needs its own)
export function createRedisConnection(): IORedis {
    return new IORedis(REDIS_URL, buildOptions());
}


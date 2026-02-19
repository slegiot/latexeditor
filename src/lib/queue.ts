// ─────────────────────────────────────────────────────────────
// BullMQ — Compilation Queue
// ─────────────────────────────────────────────────────────────

import { Queue, type ConnectionOptions } from 'bullmq';
import { getRedis } from './redis';
import type { CompileJobData } from '@/types';

export const COMPILE_QUEUE_NAME = 'latex-compile';

// Singleton queue instance
let compileQueue: Queue | null = null;

export function getCompileQueue(): Queue {
    if (!compileQueue) {
        compileQueue = new Queue(COMPILE_QUEUE_NAME, {
            connection: getRedis() as unknown as ConnectionOptions,
            defaultJobOptions: {
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: 3000,
                },
                removeOnComplete: {
                    age: 3600,     // Keep completed jobs for 1 hour
                    count: 100,    // Keep last 100 completed jobs
                },
                removeOnFail: {
                    age: 86400,    // Keep failed jobs for 24 hours
                },
            },
        });
    }
    return compileQueue;
}

/**
 * Enqueue a LaTeX compilation job.
 * Returns the BullMQ job ID.
 */
export async function enqueueCompilation(data: CompileJobData): Promise<string> {
    const queue = getCompileQueue();

    const job = await queue.add('compile', data, {
        jobId: data.compilationId,
        priority: 1,
    });

    return job.id!;
}

/**
 * Plan limits — server-side enforcement of Free / Pro / Team tier limits.
 *
 * Free: 5 projects, 2 collabs, 1-min compile, 5 AI calls/day
 * Pro:  unlimited projects/collabs, 4-min compile, unlimited AI
 * Team: same as Pro + admin, 50+ users, SSO
 */

import { createClient } from "@/lib/supabase/server";

export type PlanType = "free" | "pro" | "team";

export interface PlanLimits {
    plan: PlanType;
    maxProjects: number;
    maxCollaborators: number;
    compileTimeoutMs: number;
    aiCallsPerDay: number;
}

const PLAN_CONFIGS: Record<PlanType, Omit<PlanLimits, "plan">> = {
    free: {
        maxProjects: 5,
        maxCollaborators: 2,
        compileTimeoutMs: 60_000,   // 1 min
        aiCallsPerDay: 5,
    },
    pro: {
        maxProjects: Infinity,
        maxCollaborators: Infinity,
        compileTimeoutMs: 240_000,  // 4 min
        aiCallsPerDay: Infinity,
    },
    team: {
        maxProjects: Infinity,
        maxCollaborators: 50,
        compileTimeoutMs: 240_000,  // 4 min
        aiCallsPerDay: Infinity,
    },
};

/**
 * Fetch the current user's plan from user_subscriptions table.
 * Falls back to "free" if no subscription row exists.
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("user_subscriptions")
            .select("plan, status")
            .eq("user_id", userId)
            .single();

        if (data && data.status === "active" && ["pro", "team"].includes(data.plan)) {
            return data.plan as PlanType;
        }
    } catch {
        // Table might not exist yet or query failed — default to free
    }

    return "free";
}

/**
 * Get the full limits config for a user.
 */
export async function getUserLimits(userId: string): Promise<PlanLimits> {
    const plan = await getUserPlan(userId);
    return { plan, ...PLAN_CONFIGS[plan] };
}

/**
 * Get limits for a known plan (no DB query).
 */
export function getLimitsForPlan(plan: PlanType): PlanLimits {
    return { plan, ...PLAN_CONFIGS[plan] };
}

/**
 * Check how many projects a user currently has.
 */
export async function getUserProjectCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId);

    return count ?? 0;
}

// ── AI rate limiting by day ──

const dailyAiCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and increment the daily AI call counter for a user.
 * Returns { allowed, remaining, limit }.
 */
export function checkDailyAiLimit(
    userId: string,
    limit: number
): { allowed: boolean; remaining: number; limit: number } {
    if (limit === Infinity) {
        return { allowed: true, remaining: Infinity, limit };
    }

    const now = Date.now();
    const key = `ai-daily:${userId}`;
    const entry = dailyAiCounts.get(key);

    // Reset at midnight UTC
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const resetAt = midnight.getTime();

    if (!entry || now >= entry.resetAt) {
        dailyAiCounts.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: limit - 1, limit };
    }

    if (entry.count >= limit) {
        return { allowed: false, remaining: 0, limit };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, limit };
}

"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!POSTHOG_KEY) return;

        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            capture_pageview: true,
            capture_pageleave: true,
            persistence: "localStorage",
            autocapture: false, // manual events only for performance
        });
    }, []);

    if (!POSTHOG_KEY) {
        return <>{children}</>;
    }

    return <PHProvider client={posthog}>{children}</PHProvider>;
}

"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to join waitlist");
            }

            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center gap-2.5 text-accent-400 animate-scale-in">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-sm font-medium">You&apos;re on the list! We&apos;ll be in touch soon.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="input-field sm:max-w-xs"
            />
            <button type="submit" disabled={loading} className="btn-primary shrink-0">
                {loading ? (
                    <Loader2 className="w-4 h-4 icon-spin" />
                ) : (
                    <>
                        Join Waitlist
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
            {error && <p className="text-xs text-danger">{error}</p>}
        </form>
    );
}

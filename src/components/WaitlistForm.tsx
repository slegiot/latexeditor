"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setStatus("error");
            setMessage("Please enter a valid email address");
            return;
        }

        setStatus("loading");

        try {
            const response = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("You're on the list! We'll be in touch soon.");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            setStatus("error");
            setMessage("Failed to join waitlist. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{message}</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="input-field pl-10"
                        disabled={status === "loading"}
                        aria-label="Email address"
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-primary whitespace-nowrap"
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Joining...
                        </>
                    ) : (
                        <>
                            Join Waitlist
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
            {status === "error" && (
                <p className="mt-2 text-sm text-red-400">{message}</p>
            )}
            <p className="mt-3 text-xs text-[var(--text-muted)] text-center">
                No spam, ever. Unsubscribe anytime.
            </p>
        </form>
    );
}

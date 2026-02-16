"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Check } from "lucide-react";

export function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || status === "loading") return;

        setStatus("loading");
        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to join waitlist");
            }

            setStatus("success");
            setMessage(data.message || "You're on the list!");
            setEmail("");
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message || "Something went wrong");
        }
    };

    if (status === "success") {
        return (
            <div className="flex items-center justify-center gap-2 text-emerald-400 py-3">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">{message}</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                className="input-field flex-1 text-sm"
                disabled={status === "loading"}
            />
            <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="btn-primary text-sm px-6 py-2.5 whitespace-nowrap disabled:opacity-50"
            >
                {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        Join Waitlist
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
            {status === "error" && (
                <p className="text-xs text-red-400 sm:absolute sm:bottom-0 sm:left-0">{message}</p>
            )}
        </form>
    );
}

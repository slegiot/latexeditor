"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FileText,
    Mail,
    Lock,
    User,
    Github,
    ArrowRight,
    Loader2,
} from "lucide-react";

export default function SignUpPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    const handleGitHubLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    if (success) {
        return (
            <div className="min-h-dvh flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center animate-scale-in">
                    <div className="glass rounded-2xl p-8">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-500)]/10 flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-[var(--color-accent-400)]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                        <p className="text-[var(--color-surface-600)] text-sm">
                            We&apos;ve sent a confirmation link to{" "}
                            <span className="text-[var(--color-accent-400)] font-medium">
                                {email}
                            </span>
                            . Click the link to activate your account.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md animate-scale-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xl font-bold mb-2"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="gradient-text">LatexForge</span>
                    </Link>
                    <p className="text-[var(--color-surface-600)] text-sm mt-2">
                        Create your free account
                    </p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8">
                    {/* GitHub OAuth */}
                    <button
                        type="button"
                        onClick={handleGitHubLogin}
                        className="btn-secondary w-full py-3 mb-6"
                    >
                        <Github className="w-5 h-5" />
                        Continue with GitHub
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-[var(--color-glass-border)]" />
                        <span className="text-xs text-[var(--color-surface-500)] uppercase tracking-wider">
                            or
                        </span>
                        <div className="flex-1 h-px bg-[var(--color-glass-border)]" />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5"
                            >
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-surface-500)]" />
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Jane Doe"
                                    className="input-field pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-surface-500)]" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@university.edu"
                                    className="input-field pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[var(--color-surface-700)] mb-1.5"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-surface-500)]" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="input-field pl-10"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-[var(--color-surface-500)] mt-6">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-[var(--color-accent-400)] hover:text-[var(--color-accent-300)] font-medium transition-colors"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

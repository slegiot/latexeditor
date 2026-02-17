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
    CheckCircle2,
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
            <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-950">
                <div className="w-full max-w-sm text-center animate-scale-in">
                    <div className="glass rounded-2xl p-8">
                        <div className="w-16 h-16 rounded-2xl bg-accent-500/15 flex items-center justify-center mx-auto mb-5">
                            <Mail className="w-8 h-8 text-accent-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-3">Check your email</h2>
                        <p className="text-sm text-surface-400 leading-relaxed">
                            We&apos;ve sent a confirmation link to{" "}
                            <span className="text-white font-medium">{email}</span>
                            . Click the link to activate your account.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-950">
            {/* Decorative gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 text-white font-bold text-xl mb-3">
                        <FileText className="w-7 h-7 text-accent-400" />
                        <span>LatexForge</span>
                    </Link>
                    <p className="text-surface-500 text-sm">Create your free account</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-7 animate-slide-up" style={{ animationDelay: "100ms" }}>
                    {/* GitHub OAuth */}
                    <button
                        type="button"
                        onClick={handleGitHubLogin}
                        className="btn-secondary w-full justify-center py-2.5 mb-6"
                    >
                        <Github className="w-5 h-5" />
                        Continue with GitHub
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <hr className="flex-1 border-surface-800" />
                        <span className="text-xs text-surface-600 uppercase tracking-wider">or</span>
                        <hr className="flex-1 border-surface-800" />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-surface-300 mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Jane Doe"
                                required
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@university.edu"
                                required
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                minLength={6}
                                required
                                className="input-field"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-2.5 mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 icon-spin" />
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
                <p className="text-center text-sm text-surface-500 mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

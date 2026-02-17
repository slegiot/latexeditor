import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Code2, Github, Mail, ArrowRight } from "lucide-react";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/dashboard");
    }

    const error = params.error as string | undefined;
    const message = params.message as string | undefined;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">LaTeX Forge</span>
                    </Link>
                    <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                    <p className="text-[var(--text-secondary)]">
                        Sign in to continue to your projects
                    </p>
                </div>

                {/* Card */}
                <div className="card p-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error === "auth"
                                ? "Authentication failed. Please try again."
                                : error}
                        </div>
                    )}

                    {/* Success Message */}
                    {message && (
                        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                            {message}
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="space-y-3 mb-6">
                        <a
                            href="/api/auth/github"
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-primary)] transition-all"
                        >
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </a>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--border-secondary)]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form action="/api/auth/login" method="POST" className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                            >
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="input-field pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="input-field"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-tertiary)]"
                                />
                                Remember me
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-emerald-400 hover:text-emerald-300"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="w-full btn-primary justify-center">
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
                    Don't have an account?{" "}
                    <Link
                        href="/signup"
                        className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

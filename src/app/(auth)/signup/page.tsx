import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Code2, Github, Mail, ArrowRight, CheckCircle } from "lucide-react";

export default async function SignupPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/dashboard");
    }

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
                    <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                    <p className="text-[var(--text-secondary)]">
                        Start writing beautiful LaTeX documents today
                    </p>
                </div>

                {/* Card */}
                <div className="card p-8">
                    {/* Social Signup */}
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
                                Or sign up with email
                            </span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form action="/api/auth/signup" method="POST" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                                >
                                    First name
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    placeholder="John"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="lastName"
                                    className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                                >
                                    Last name
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    placeholder="Doe"
                                    className="input-field"
                                />
                            </div>
                        </div>

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
                                minLength={8}
                                placeholder="••••••••"
                                className="input-field"
                            />
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Must be at least 8 characters
                            </p>
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="mt-1 w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-tertiary)]"
                            />
                            <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]">
                                I agree to the{" "}
                                <Link href="/terms" className="text-emerald-400 hover:text-emerald-300">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        <button type="submit" className="w-full btn-primary justify-center">
                            Create Account
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Features */}
                    <div className="mt-6 pt-6 border-t border-[var(--border-secondary)]">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span>Free forever</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span>No credit card</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span>3 projects free</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span>AI assistance</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

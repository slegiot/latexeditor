import Link from "next/link";
import {
    FileText,
    Users,
    GitBranch,
    Zap,
    ArrowRight,
    Terminal,
    Sparkles,
    LayoutTemplate,
    Shield,
    Check,
} from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "AI Error Fixing",
        description:
            "Compile fails? One click and DeepSeek R1 diagnoses and patches your LaTeX instantly.",
        badge: "NEW",
    },
    {
        icon: LayoutTemplate,
        title: "AI Template Generation",
        description:
            "Describe your document in plain English. Get a complete, compilable LaTeX template in seconds.",
        badge: "NEW",
    },
    {
        icon: FileText,
        title: "Rich LaTeX Editing",
        description:
            "Monaco-powered editor with syntax highlighting, autocomplete, and real-time error detection.",
    },
    {
        icon: Users,
        title: "Real-Time Collaboration",
        description:
            "Work simultaneously with teammates using conflict-free CRDT synchronization.",
    },
    {
        icon: Terminal,
        title: "Instant PDF Compilation",
        description:
            "Docker-powered TeXLive compilation with live preview and smart diagnostics.",
    },
    {
        icon: GitBranch,
        title: "Git Integration",
        description:
            "Sync your projects with GitHub. Push, pull, and version your work natively.",
    },
];

const tiers = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for students and personal projects",
        features: [
            "5 projects",
            "2 collaborators",
            "1-min compile timeout",
            "5 AI calls per day",
            "Community support",
        ],
        cta: "Get Started",
        href: "/signup",
        highlight: false,
    },
    {
        name: "Pro",
        price: "$9",
        period: "/mo",
        description: "For researchers and power users",
        features: [
            "Unlimited projects & collabs",
            "4-min compile timeout",
            "Unlimited AI fixes",
            "GitHub sync",
            "Custom templates",
            "Priority support",
        ],
        cta: "Upgrade to Pro",
        href: "/signup?plan=pro",
        highlight: true,
    },
    {
        name: "Team",
        price: "$19",
        period: "/mo per user",
        description: "For labs, departments, and organizations",
        features: [
            "Everything in Pro",
            "Shared billing",
            "Admin dashboard",
            "50+ users",
            "SSO (coming soon)",
            "Dedicated support",
        ],
        cta: "Contact Sales",
        href: "/signup?plan=team",
        highlight: false,
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-dvh flex flex-col">
            {/* ── Nav ── */}
            <nav className="fixed top-0 inset-x-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="gradient-text">LatexForge</span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-6 text-sm text-[var(--color-surface-500)]">
                        <a href="#features" className="hover:text-[var(--color-accent-400)] transition-colors">
                            Features
                        </a>
                        <a href="#pricing" className="hover:text-[var(--color-accent-400)] transition-colors">
                            Pricing
                        </a>
                        <Link href="/login" className="hover:text-[var(--color-accent-400)] transition-colors">
                            Sign In
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="btn-secondary text-sm px-4 py-2 hidden sm:flex"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="btn-primary text-sm px-4 py-2"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <main className="flex-1 flex flex-col items-center px-6 pt-32 pb-20">
                <div className="text-center max-w-3xl mx-auto animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-[var(--color-surface-700)] mb-8">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Now with AI-powered error fixing
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        Write LaTeX with
                        <br />
                        <span className="gradient-text">AI Superpowers.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-surface-600)] max-w-2xl mx-auto mb-10">
                        A modern, AI-powered LaTeX editor with real-time collaboration,
                        instant PDF compilation, and one-click error fixing — all in your browser.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link href="/signup" className="btn-primary text-base px-8 py-3.5">
                            Start Writing — It&apos;s Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-base px-8 py-3.5"
                        >
                            <GitBranch className="w-5 h-5" />
                            View on GitHub
                        </a>
                    </div>
                </div>

                {/* ── AI Preview Mockup ── */}
                <div
                    className="mt-8 w-full max-w-5xl mx-auto rounded-2xl overflow-hidden glass animate-slide-up"
                    style={{ animationDelay: "0.2s", animationFillMode: "both" }}
                >
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-glass-border)]">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-xs text-[var(--color-surface-500)] ml-2">
                            main.tex — LatexForge
                        </span>
                        <div className="ml-auto flex items-center gap-1.5 text-xs">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI
                            </span>
                        </div>
                    </div>
                    <div className="flex">
                        {/* Editor side */}
                        <div className="flex-1 p-6 font-mono text-sm text-[var(--color-surface-700)] leading-relaxed border-r border-[var(--color-glass-border)]">
                            <div>
                                <span className="text-[var(--color-accent-400)]">\documentclass</span>
                                {"{article}"}
                            </div>
                            <div>
                                <span className="text-[var(--color-accent-400)]">\usepackage</span>
                                {"[utf8]"}{"{inputenc}"}
                            </div>
                            <div>
                                <span className="text-[var(--color-accent-400)]">\usepackage</span>
                                {"{amsmath}"}
                            </div>
                            <div className="mt-3">
                                <span className="text-[var(--color-accent-400)]">\begin</span>
                                {"{document}"}
                            </div>
                            <div className="ml-4 mt-2">
                                <span className="text-[var(--color-accent-400)]">\section</span>
                                {"{Introduction}"}
                            </div>
                            <div className="ml-4 text-[var(--color-surface-600)]">
                                LatexForge makes academic writing effortless...
                            </div>
                            <div className="mt-3">
                                <span className="text-[var(--color-accent-400)]">\end</span>
                                {"{document}"}
                            </div>
                        </div>
                        {/* AI sidebar mockup */}
                        <div className="w-64 p-4 bg-[var(--color-surface-100)]">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-semibold">AI Assistant</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-3">
                                ✓ Fixed missing package import
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-3">
                                ✓ Corrected bracket mismatch
                            </div>
                            <button className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                Apply All Fixes
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Features ── */}
                <section id="features" className="mt-32 w-full max-w-6xl mx-auto scroll-mt-24">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
                        Everything you need to{" "}
                        <span className="gradient-text">publish</span>
                    </h2>
                    <p className="text-center text-[var(--color-surface-600)] mb-16 max-w-xl mx-auto">
                        From AI-powered drafting to final PDF — LatexForge handles the entire
                        LaTeX workflow.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={feature.title}
                                className="group p-6 rounded-2xl glass glass-hover transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] relative"
                                style={{
                                    animation: `fade-in 0.5s ease ${0.1 * i}s both`,
                                }}
                            >
                                {"badge" in feature && feature.badge && (
                                    <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                        {feature.badge}
                                    </span>
                                )}
                                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-500)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent-500)]/20 transition-colors">
                                    <feature.icon className="w-6 h-6 text-[var(--color-accent-400)]" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm text-[var(--color-surface-600)] leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Pricing ── */}
                <section id="pricing" className="mt-32 w-full max-w-5xl mx-auto scroll-mt-24">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
                        Simple, transparent{" "}
                        <span className="gradient-text">pricing</span>
                    </h2>
                    <p className="text-center text-[var(--color-surface-600)] mb-16 max-w-xl mx-auto">
                        Start free, upgrade when you need more AI power and collaboration features.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative p-6 rounded-2xl transition-all duration-300 ${tier.highlight
                                    ? "glass border-2 border-[var(--color-accent-400)] shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                                    : "glass glass-hover"
                                    }`}
                            >
                                {tier.highlight && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent-500)] text-white">
                                        Most Popular
                                    </span>
                                )}
                                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                                <p className="text-sm text-[var(--color-surface-500)] mb-4">
                                    {tier.description}
                                </p>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-extrabold">{tier.price}</span>
                                    <span className="text-sm text-[var(--color-surface-500)]">
                                        {tier.period}
                                    </span>
                                </div>
                                <ul className="space-y-2.5 mb-6">
                                    {tier.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-surface-600)]">
                                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={tier.href}
                                    className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${tier.highlight
                                        ? "bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)]"
                                        : "glass glass-hover"
                                        }`}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>


            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-[var(--color-glass-border)] py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-surface-500)]">
                    <span>&copy; {new Date().getFullYear()} LatexForge. Open Source.</span>
                    <div className="flex items-center gap-6">
                        <a href="#features" className="hover:text-[var(--color-accent-400)] transition-colors">
                            Features
                        </a>
                        <Link href="/pricing" className="hover:text-[var(--color-accent-400)] transition-colors">
                            Pricing
                        </Link>
                        <a href="https://github.com" className="hover:text-[var(--color-accent-400)] transition-colors">
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

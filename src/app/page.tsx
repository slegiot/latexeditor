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
    Github,
    Star,
    ChevronRight,
    Globe,
    Code2,
    BookOpen,
} from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "AI Error Fixing",
        description:
            "Compile fails? One click and DeepSeek R1 diagnoses and patches your LaTeX instantly.",
        badge: "NEW",
        color: "from-amber-500 to-orange-500",
    },
    {
        icon: LayoutTemplate,
        title: "AI Template Generation",
        description:
            "Describe your document in plain English. Get a complete, compilable LaTeX template in seconds.",
        badge: "NEW",
        color: "from-violet-500 to-purple-500",
    },
    {
        icon: FileText,
        title: "Rich LaTeX Editing",
        description:
            "Monaco-powered editor with syntax highlighting, autocomplete, and real-time error detection.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: Users,
        title: "Real-Time Collaboration",
        description:
            "Work simultaneously with teammates using conflict-free CRDT synchronization.",
        color: "from-emerald-500 to-teal-500",
    },
    {
        icon: Terminal,
        title: "Instant PDF Compilation",
        description:
            "Docker-powered TeXLive compilation with live preview and smart diagnostics.",
        color: "from-rose-500 to-pink-500",
    },
    {
        icon: GitBranch,
        title: "Git Integration",
        description:
            "Sync your projects with GitHub. Push, pull, and version your work natively.",
        color: "from-slate-500 to-gray-500",
    },
    {
        icon: Shield,
        title: "Open Source & Self-Hostable",
        description:
            "100% open source. Deploy on your own infrastructure or use our hosted version.",
        color: "from-emerald-500 to-green-600",
    },
    {
        icon: BookOpen,
        title: "Template Library",
        description:
            "Start from professional templates for papers, theses, presentations, CVs, and more.",
        color: "from-indigo-500 to-blue-500",
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
        cta: "Get Started Free",
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

const stats = [
    { icon: Code2, label: "Open Source", value: "100%" },
    { icon: Globe, label: "Self-Hostable", value: "Yes" },
    { icon: Users, label: "Active Users", value: "1K+" },
    { icon: Zap, label: "Compilations", value: "50K+" },
];

export default function LandingPage() {
    return (
        <div className="min-h-dvh flex flex-col bg-[var(--color-surface-0)]">
            {/* ── Nav ── */}
            <nav className="fixed top-0 inset-x-0 z-50 glass" role="navigation" aria-label="Main navigation">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <FileText className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="gradient-text text-xl">LatexForge</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-surface-600)]">
                        <a href="#features" className="hover:text-[var(--color-accent-400)] transition-colors duration-200">
                            Features
                        </a>
                        <a href="#pricing" className="hover:text-[var(--color-accent-400)] transition-colors duration-200">
                            Pricing
                        </a>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--color-accent-400)] transition-colors duration-200 flex items-center gap-1.5"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
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
                            className="btn-primary text-sm px-5 py-2.5"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <main className="flex-1 flex flex-col items-center relative overflow-hidden">
                {/* Animated gradient mesh background */}
                <div
                    className="absolute inset-0 animate-gradient opacity-30"
                    style={{
                        background:
                            "radial-gradient(ellipse at 20% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6, 95, 70, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(52, 211, 153, 0.08) 0%, transparent 50%)",
                        backgroundSize: "200% 200%",
                    }}
                />
                {/* Grain overlay */}
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />

                <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-32 sm:pt-40 pb-12 animate-fade-in">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-[var(--color-surface-700)] mb-8 border border-amber-500/20">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Now with AI-powered error fixing & template generation
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
                        Write LaTeX with
                        <br />
                        <span className="gradient-text text-glow">AI Superpowers.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-[var(--color-surface-600)] max-w-2xl mx-auto mb-10 leading-relaxed">
                        A modern, open-source LaTeX editor with real-time collaboration,
                        instant PDF compilation, and one-click AI error fixing — all in your browser.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link
                            href="/signup"
                            className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                        >
                            Start Writing — It&apos;s Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-base px-8 py-3.5"
                        >
                            <Github className="w-5 h-5" />
                            View on GitHub
                        </a>
                    </div>

                    {/* Stats bar */}
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-16">
                        {stats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2 text-sm text-[var(--color-surface-600)]">
                                <stat.icon className="w-4 h-4 text-[var(--color-accent-400)]" />
                                <span className="font-semibold text-[var(--color-surface-800)]">{stat.value}</span>
                                <span className="hidden sm:inline">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Editor Preview Mockup ── */}
                <div
                    className="relative z-10 w-full max-w-5xl mx-auto px-6 animate-slide-up"
                    style={{ animationDelay: "0.3s", animationFillMode: "both" }}
                >
                    <div className="rounded-2xl overflow-hidden border border-[var(--color-glass-border)] shadow-2xl shadow-black/30 bg-[var(--color-surface-50)]">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-100)]">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-xs text-[var(--color-surface-500)] px-3 py-0.5 rounded-md bg-[var(--color-surface-200)]/50">
                                    main.tex — LatexForge
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    AI
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                                    Live
                                </span>
                            </div>
                        </div>

                        {/* Editor content */}
                        <div className="flex">
                            {/* Line numbers + code */}
                            <div className="flex-1 p-5 font-mono text-xs sm:text-[13px] leading-7 border-r border-[var(--color-glass-border)] bg-[#0c1117]">
                                <div className="flex">
                                    <div className="pr-4 text-right text-[var(--color-surface-400)] select-none" aria-hidden="true">
                                        {Array.from({ length: 9 }, (_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                    </div>
                                    <div className="text-[#d4d4d4]">
                                        <div>
                                            <span className="text-[#4EC9B0]">\documentclass</span>
                                            <span className="text-[#FFD700]">{"{"}</span>
                                            article
                                            <span className="text-[#FFD700]">{"}"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#4EC9B0]">\usepackage</span>
                                            <span className="text-[#DA70D6]">[</span>
                                            utf8
                                            <span className="text-[#DA70D6]">]</span>
                                            <span className="text-[#FFD700]">{"{"}</span>
                                            inputenc
                                            <span className="text-[#FFD700]">{"}"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#4EC9B0]">\usepackage</span>
                                            <span className="text-[#FFD700]">{"{"}</span>
                                            amsmath
                                            <span className="text-[#FFD700]">{"}"}</span>
                                        </div>
                                        <div className="h-7" />
                                        <div>
                                            <span className="text-[#4EC9B0]">\begin</span>
                                            <span className="text-[#FFD700]">{"{"}</span>
                                            document
                                            <span className="text-[#FFD700]">{"}"}</span>
                                        </div>
                                        <div className="ml-6">
                                            <span className="text-[#C586C0] font-bold">\section</span>
                                            <span className="text-[#FFD700]">{"{"}</span>
                                            Introduction
                                            <span className="text-[#FFD700]">{"}"}</span>
                                        </div>
                                        <div className="ml-6 text-[#7c8b9e]">
                                            LatexForge makes academic writing effortless...
                                        </div>
                                        <div className="h-7" />
                                        <div>
                                            <span className="text-[#4EC9B0]">\end</span>
                                            <span className="text-[#FFD700]">{"{"}</span>
                                            document
                                            <span className="text-[#FFD700]">{"}"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI sidebar mockup */}
                            <div className="w-56 hidden sm:flex flex-col p-4 bg-[var(--color-surface-100)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-bold">AI Assistant</span>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                                        ✓ Fixed missing package import
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                                        ✓ Corrected bracket mismatch
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400">
                                        💡 Consider using \eqref for references
                                    </div>
                                </div>
                                <button className="w-full py-2 px-3 text-[11px] font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white mt-3 hover:brightness-110 transition-all">
                                    Apply All Fixes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Features ── */}
                <section id="features" className="mt-24 sm:mt-32 w-full max-w-6xl mx-auto px-6 scroll-mt-24">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                            Everything you need to{" "}
                            <span className="gradient-text">publish</span>
                        </h2>
                        <p className="text-[var(--color-surface-600)] max-w-xl mx-auto text-base">
                            From AI-powered drafting to final PDF — LatexForge handles the entire
                            LaTeX workflow so you can focus on your research.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((feature, i) => (
                            <div
                                key={feature.title}
                                className="group relative p-5 rounded-2xl card-glass hover:translate-y-[-2px]"
                                style={{
                                    animation: `fade-in 0.5s ease ${0.08 * i}s both`,
                                }}
                            >
                                {"badge" in feature && feature.badge && (
                                    <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">
                                        {feature.badge}
                                    </span>
                                )}
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-base font-bold mb-1.5">{feature.title}</h3>
                                <p className="text-sm text-[var(--color-surface-600)] leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── How it works ── */}
                <section className="mt-24 sm:mt-32 w-full max-w-4xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                            From idea to PDF in{" "}
                            <span className="gradient-text">minutes</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { step: "1", title: "Create a project", desc: "Start from a blank document or choose from dozens of professional templates." },
                            { step: "2", title: "Write & collaborate", desc: "Edit with a powerful Monaco editor while teammates join in real-time." },
                            { step: "3", title: "Compile & share", desc: "One-click PDF compilation. Download, share a link, or push to GitHub." },
                        ].map((item, i) => (
                            <div
                                key={item.step}
                                className="relative text-center p-6"
                                style={{ animation: `fade-in 0.5s ease ${0.15 * i}s both` }}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-accent-500)] to-[var(--color-accent-700)] flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                                    {item.step}
                                </div>
                                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                                <p className="text-sm text-[var(--color-surface-600)] leading-relaxed">{item.desc}</p>
                                {i < 2 && (
                                    <ChevronRight className="hidden sm:block absolute top-10 -right-3 w-5 h-5 text-[var(--color-surface-400)]" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Pricing ── */}
                <section id="pricing" className="mt-24 sm:mt-32 w-full max-w-5xl mx-auto px-6 scroll-mt-24 pb-20">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                            Simple, transparent{" "}
                            <span className="gradient-text">pricing</span>
                        </h2>
                        <p className="text-[var(--color-surface-600)] max-w-lg mx-auto text-base">
                            Start free, upgrade when you need more AI power and collaboration features.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative p-6 rounded-2xl transition-all duration-300 ${tier.highlight
                                    ? "card-glass border-2 border-[var(--color-accent-400)]/50 shadow-[0_0_60px_rgba(16,185,129,0.12)] scale-[1.02]"
                                    : "card-glass"
                                    }`}
                            >
                                {tier.highlight && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--color-accent-500)] to-[var(--color-accent-600)] text-white shadow-lg shadow-emerald-500/20">
                                        Most Popular
                                    </span>
                                )}
                                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                                <p className="text-sm text-[var(--color-surface-500)] mb-5">
                                    {tier.description}
                                </p>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-extrabold">{tier.price}</span>
                                    <span className="text-sm text-[var(--color-surface-500)]">
                                        {tier.period}
                                    </span>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {tier.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-surface-700)]">
                                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={tier.href}
                                    className={`block w-full text-center py-3 px-4 rounded-xl text-sm font-semibold transition-all ${tier.highlight
                                        ? "bg-gradient-to-r from-[var(--color-accent-500)] to-[var(--color-accent-600)] text-white hover:brightness-110 shadow-lg shadow-emerald-500/20"
                                        : "glass glass-hover border border-[var(--color-glass-border)]"
                                        }`}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Pricing note */}
                    <p className="text-center text-sm text-[var(--color-surface-500)] mt-8">
                        All plans include unlimited storage, HTTPS access, and email support.
                        <br />
                        Self-host for free with no limits — <a href="https://github.com/slegiot/latexeditor" className="text-[var(--color-accent-400)] hover:underline" target="_blank" rel="noopener noreferrer">view deployment guide</a>.
                    </p>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-[var(--color-glass-border)] py-8 px-6 bg-[var(--color-surface-50)]/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Logo + tagline */}
                        <div className="flex flex-col gap-2">
                            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="gradient-text">LatexForge</span>
                            </Link>
                            <p className="text-xs text-[var(--color-surface-500)] max-w-xs">
                                Open-source collaborative LaTeX editor.
                                Write, compile, and publish — together.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm text-[var(--color-surface-500)]">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-[var(--color-surface-700)] uppercase tracking-wider">Product</span>
                                <a href="#features" className="hover:text-[var(--color-accent-400)] transition-colors">Features</a>
                                <Link href="/pricing" className="hover:text-[var(--color-accent-400)] transition-colors">Pricing</Link>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-[var(--color-surface-700)] uppercase tracking-wider">Resources</span>
                                <a href="https://github.com/slegiot/latexeditor" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent-400)] transition-colors flex items-center gap-1.5">
                                    <Github className="w-3.5 h-3.5" />
                                    GitHub
                                </a>
                                <a href="https://github.com/slegiot/latexeditor/issues" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent-400)] transition-colors">
                                    Report a Bug
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--color-glass-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-surface-500)]">
                        <span>&copy; {new Date().getFullYear()} LatexForge. Open Source under MIT License.</span>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-[var(--color-accent-400)] transition-colors"
                        >
                            <Star className="w-3.5 h-3.5" />
                            Star us on GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

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
    {
        icon: Shield,
        title: "Open Source & Self-Hostable",
        description:
            "100% open source. Deploy on your own infrastructure or use our hosted version.",
    },
    {
        icon: BookOpen,
        title: "Template Library",
        description:
            "Start from professional templates for papers, theses, presentations, CVs, and more.",
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
        <div className="min-h-screen bg-surface-950 text-surface-100">
            {/* ── Nav ── */}
            <nav
                role="navigation"
                aria-label="Main navigation"
                className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-800/50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-lg">
                        <FileText className="w-6 h-6 text-accent-400" />
                        <span>LatexForge</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm text-surface-400 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-sm text-surface-400 hover:text-white transition-colors">Pricing</a>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
                        <Link href="/signup" className="btn-primary text-sm">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <main>
                <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center animate-fade-in">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-medium mb-8">
                        <Sparkles className="w-4 h-4" />
                        Now with AI-powered error fixing &amp; template generation
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        Write LaTeX with{" "}
                        <span className="gradient-text">AI Superpowers.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        A modern, open-source LaTeX editor with real-time collaboration,
                        instant PDF compilation, and one-click AI error fixing — all in your browser.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link href="/signup" className="btn-primary text-base px-7 py-3">
                            Start Writing — It&apos;s Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-base px-7 py-3"
                        >
                            <Github className="w-5 h-5" />
                            View on GitHub
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
                        {stats.map((stat) => (
                            <div key={stat.label} className="flex flex-col items-center gap-1 p-4 rounded-xl bg-surface-900/50 border border-surface-800/50">
                                <stat.icon className="w-5 h-5 text-accent-400 mb-1" />
                                <span className="text-xl font-bold text-white">{stat.value}</span>
                                <span className="text-xs text-surface-500">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Features ── */}
                <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to publish</h2>
                        <p className="text-surface-400 text-lg">
                            From AI-powered drafting to final PDF — LatexForge handles the entire
                            LaTeX workflow so you can focus on your research.
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((feature, i) => (
                            <div
                                key={feature.title}
                                className="relative p-6 rounded-2xl glass card-hover group"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                {"badge" in feature && feature.badge && (
                                    <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-400 border border-accent-500/25">
                                        {feature.badge}
                                    </span>
                                )}
                                <div className="w-11 h-11 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 transition-colors">
                                    <feature.icon className="w-5 h-5 text-accent-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── How it works ── */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-900/30">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold">From idea to PDF in minutes</h2>
                    </div>
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "1", title: "Create a project", desc: "Start from a blank document or choose from dozens of professional templates." },
                            { step: "2", title: "Write & collaborate", desc: "Edit with a powerful Monaco editor while teammates join in real-time." },
                            { step: "3", title: "Compile & share", desc: "One-click PDF compilation. Download, share a link, or push to GitHub." },
                        ].map((item) => (
                            <div key={item.step} className="text-center p-8 rounded-2xl glass">
                                <div className="w-12 h-12 rounded-2xl bg-accent-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-5">
                                    {item.step}
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-3">{item.title}</h3>
                                <p className="text-sm text-surface-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Pricing ── */}
                <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
                        <p className="text-surface-400 text-lg">
                            Start free, upgrade when you need more AI power and collaboration features.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative p-8 rounded-2xl glass flex flex-col ${tier.highlight
                                        ? "border-accent-500/40 ring-1 ring-accent-500/20 animate-pulse-glow"
                                        : ""
                                    }`}
                            >
                                {tier.highlight && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent-500 text-white">
                                        Most Popular
                                    </span>
                                )}
                                <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                                <p className="text-sm text-surface-400 mt-1">{tier.description}</p>
                                <div className="flex items-baseline gap-1 mt-6 mb-6">
                                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                                    <span className="text-sm text-surface-500">{tier.period}</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-surface-300">
                                            <Check className="w-4 h-4 text-accent-400 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={tier.href}
                                    className={tier.highlight ? "btn-primary justify-center w-full" : "btn-secondary justify-center w-full"}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-surface-500 mt-10 max-w-xl mx-auto">
                        All plans include unlimited storage, HTTPS access, and email support.
                        <br />
                        Self-host for free with no limits —{" "}
                        <a href="https://github.com/slegiot/latexeditor" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:underline">
                            view deployment guide
                        </a>.
                    </p>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-surface-800/50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
                        <div className="max-w-xs">
                            <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-lg mb-3">
                                <FileText className="w-5 h-5 text-accent-400" />
                                <span>LatexForge</span>
                            </Link>
                            <p className="text-sm text-surface-500 leading-relaxed">
                                Open-source collaborative LaTeX editor.
                                Write, compile, and publish — together.
                            </p>
                        </div>

                        <div className="flex gap-16">
                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Product</span>
                                <a href="#features" className="text-sm text-surface-400 hover:text-white transition-colors">Features</a>
                                <Link href="/pricing" className="text-sm text-surface-400 hover:text-white transition-colors">Pricing</Link>
                            </div>
                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Resources</span>
                                <a href="https://github.com/slegiot/latexeditor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors">
                                    <Github className="w-3.5 h-3.5" />
                                    GitHub
                                </a>
                                <a href="https://github.com/slegiot/latexeditor/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-surface-400 hover:text-white transition-colors">
                                    Report a Bug
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-800/50">
                        <span className="text-xs text-surface-600">
                            &copy; {new Date().getFullYear()} LatexForge. Open Source under MIT License.
                        </span>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-accent-400 transition-colors"
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

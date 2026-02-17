import { Navbar } from "@/components/Navbar";
import { WaitlistForm } from "@/components/WaitlistForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    FileText,
    Users,
    GitBranch,
    Zap,
    Sparkles,
    Shield,
    Globe,
    ChevronRight,
    Code2,
    Eye,
    History,
    Bot,
    Github,
    Twitter,
    MessageCircle,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden">
            {/* Navigation */}
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-500/5 to-transparent rounded-full" />
                </div>

                <div className="relative max-w-7xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-fade-in-up">
                        <Sparkles className="w-4 h-4" />
                        <span>Now in Open Beta</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up delay-100">
                        <span className="text-[var(--text-primary)]">Write LaTeX</span>
                        <br />
                        <span className="gradient-text-hero">Like Never Before</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[var(--text-secondary)] mb-10 animate-fade-in-up delay-200">
                        The open-source Overleaf alternative with real-time collaboration,
                        AI-powered assistance, and seamless Git integration. Built for modern
                        researchers and teams.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up delay-300">
                        <Link
                            href="/signup"
                            className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
                        >
                            <Zap className="w-5 h-5" />
                            Get Started Free
                        </Link>
                        <Link
                            href="#features"
                            className="btn-secondary text-base px-8 py-4 w-full sm:w-auto"
                        >
                            <Eye className="w-5 h-5" />
                            View Demo
                        </Link>
                    </div>

                    {/* Hero Image / Editor Preview */}
                    <div className="relative max-w-5xl mx-auto animate-fade-in-up delay-400">
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-2xl">
                            {/* Mock Editor Header */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="text-xs text-[var(--text-muted)]">
                                        research-paper.tex
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                </div>
                            </div>
                            {/* Mock Editor Content */}
                            <div className="grid grid-cols-2 bg-[var(--bg-primary)]">
                                <div className="p-6 font-mono text-sm text-left">
                                    <div className="text-[var(--text-muted)]">
                                        {"\\documentclass"}
                                        <span className="text-emerald-400">{"{article}"}</span>
                                    </div>
                                    <div className="text-[var(--text-muted)] mt-1">
                                        {"\\usepackage"}
                                        <span className="text-emerald-400">{"[utf8]"}</span>
                                        <span className="text-[var(--text-secondary)]">
                                            {"{inputenc}"}
                                        </span>
                                    </div>
                                    <div className="mt-4 text-[var(--text-secondary)]">
                                        {"\\title"}
                                        <span className="text-emerald-400">
                                            {"{Breakthrough Research}"}
                                        </span>
                                    </div>
                                    <div className="text-[var(--text-secondary)]">
                                        {"\\author"}
                                        <span className="text-emerald-400">{"{Dr. Smith}"}</span>
                                    </div>
                                    <div className="mt-4 text-[var(--text-muted)]">
                                        {"\\begin"}
                                        <span className="text-emerald-400">{"{document}"}</span>
                                    </div>
                                    <div className="pl-4 text-[var(--text-secondary)] mt-2">
                                        {"\\maketitle"}
                                    </div>
                                    <div className="pl-4 text-[var(--text-muted)] mt-2">
                                        {"\\section"}
                                        <span className="text-emerald-400">{"{Introduction}"}</span>
                                    </div>
                                    <div className="pl-8 text-[var(--text-secondary)] mt-1 opacity-50">
                                        {"Start writing your masterpiece..."}
                                    </div>
                                </div>
                                <div className="border-l border-[var(--border-secondary)] bg-[var(--color-surface-50)] dark:bg-[var(--bg-secondary)] p-8 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-red-500" />
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">PDF Preview</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Floating Elements */}
                        <div className="absolute -top-4 -right-4 glass px-4 py-2 rounded-lg shadow-lg animate-bounce-subtle hidden lg:flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium">3 collaborators active</span>
                        </div>
                        <div className="absolute -bottom-4 -left-4 glass px-4 py-2 rounded-lg shadow-lg animate-bounce-subtle hidden lg:flex items-center gap-2 delay-200">
                            <Bot className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium">AI suggestions ready</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                            Powerful features designed for serious LaTeX users. From
                            collaboration to AI assistance, we've got you covered.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="card card-hover p-6 group"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-[var(--text-secondary)] text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Real-time Collaboration Section */}
            <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
                                <Users className="w-4 h-4" />
                                <span>Real-time Collaboration</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                                Work Together,{" "}
                                <span className="gradient-text">Seamlessly</span>
                            </h2>
                            <p className="text-[var(--text-secondary)] mb-8 text-lg">
                                See your teammates' cursors, edits, and selections in real-time.
                                No more merge conflicts or version confusion. Just smooth,
                                collaborative writing.
                            </p>
                            <ul className="space-y-4">
                                {collaborationFeatures.map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span className="text-[var(--text-secondary)]">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="glass rounded-2xl p-6 border border-[var(--border-primary)]">
                                <div className="space-y-4">
                                    {/* Simulated collaborative editing */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                            JD
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">John Doe</span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    editing
                                                </span>
                                            </div>
                                            <div className="h-2 bg-blue-500/20 rounded w-3/4" />
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                                            AS
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">Alice Smith</span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    viewing
                                                </span>
                                            </div>
                                            <div className="h-2 bg-purple-500/20 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                                            You
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">You</span>
                                                <span className="text-xs text-emerald-400">active</span>
                                            </div>
                                            <div className="h-2 bg-emerald-500/20 rounded w-2/3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Assistance Section */}
            <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="glass rounded-2xl p-6 border border-[var(--border-primary)]">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-secondary)]">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                    <span className="font-medium">AI Assistant</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Fix the LaTeX error in my equation
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="flex-1 bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                I found the issue. You're missing a closing brace. Here's
                                                the fix:
                                            </p>
                                            <code className="block mt-2 text-xs bg-[var(--bg-secondary)] p-2 rounded text-emerald-400">
                                                {"\\sum_{i=1}^{n} x_i"}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-6">
                                <Bot className="w-4 h-4" />
                                <span>AI-Powered</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                                Your Personal LaTeX{" "}
                                <span className="gradient-text">Expert</span>
                            </h2>
                            <p className="text-[var(--text-secondary)] mb-8 text-lg">
                                Stuck on a complex equation? Need help formatting? Our AI
                                assistant understands LaTeX and helps you write better documents
                                faster.
                            </p>
                            <ul className="space-y-4">
                                {aiFeatures.map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                        </div>
                                        <span className="text-[var(--text-secondary)]">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Git Integration Section */}
            <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium mb-6">
                                <GitBranch className="w-4 h-4" />
                                <span>Git Integration</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                                Version Control,{" "}
                                <span className="gradient-text">Simplified</span>
                            </h2>
                            <p className="text-[var(--text-secondary)] mb-8 text-lg">
                                Connect your GitHub repository and sync your LaTeX projects
                                seamlessly. Track changes, collaborate with developers, and
                                maintain version history.
                            </p>
                            <ul className="space-y-4">
                                {gitFeatures.map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                            <GitBranch className="w-3 h-3 text-orange-400" />
                                        </div>
                                        <span className="text-[var(--text-secondary)]">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="glass rounded-2xl p-6 border border-[var(--border-primary)]">
                                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--border-secondary)]">
                                    <History className="w-5 h-5 text-orange-400" />
                                    <span className="font-medium">Version History</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { time: "2 mins ago", msg: "Fix equation formatting", active: true },
                                        { time: "1 hour ago", msg: "Add introduction section", active: false },
                                        { time: "3 hours ago", msg: "Initial commit", active: false },
                                    ].map((commit, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${commit.active
                                                    ? "bg-emerald-500/10 border border-emerald-500/20"
                                                    : "bg-[var(--bg-tertiary)]"
                                                }`}
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${commit.active ? "bg-emerald-400" : "bg-[var(--text-muted)]"
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{commit.msg}</p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {commit.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-12">
                        Start free, upgrade when you need more. No hidden fees, no surprises.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {pricingTiers.map((tier, index) => (
                            <div
                                key={tier.name}
                                className={`card p-6 text-left ${tier.popular ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : ""
                                    }`}
                            >
                                {tier.popular && (
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
                                        <Sparkles className="w-3 h-3" />
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-bold">{tier.price}</span>
                                    {tier.period && (
                                        <span className="text-[var(--text-muted)]">{tier.period}</span>
                                    )}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">
                                    {tier.description}
                                </p>
                                <ul className="space-y-3 mb-6">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm">
                                            <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                            <span className="text-[var(--text-secondary)]">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={tier.ctaLink}
                                    className={`w-full btn-primary justify-center ${tier.popular ? "" : "btn-secondary"
                                        }`}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Waitlist Section */}
            <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]/50">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-[var(--text-secondary)] mb-8">
                        Join thousands of researchers, students, and professionals who are
                        already writing better LaTeX with LaTeX Forge.
                    </p>
                    <WaitlistForm />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-secondary)]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                                    <Code2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-lg">LaTeX Forge</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                The open-source LaTeX editor built for modern teams.
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                    aria-label="GitHub"
                                >
                                    <Github className="w-4 h-4" />
                                </a>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                    aria-label="Twitter"
                                >
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a
                                    href="#"
                                    className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                                    aria-label="Discord"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2">
                                {["Features", "Pricing", "Templates", "Changelog"].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href="#"
                                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2">
                                {["Documentation", "API Reference", "Guides", "Blog"].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href="#"
                                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2">
                                {["About", "Careers", "Contact", "Privacy"].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href="#"
                                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-[var(--border-secondary)] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-[var(--text-muted)]">
                            © {new Date().getFullYear()} LaTeX Forge. Open source under MIT license.
                        </p>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const features = [
    {
        icon: Users,
        title: "Real-time Collaboration",
        description:
            "Work together with your team in real-time. See cursors, selections, and edits as they happen.",
    },
    {
        icon: Bot,
        title: "AI Assistance",
        description:
            "Get intelligent suggestions, error fixes, and writing help from our AI-powered assistant.",
    },
    {
        icon: GitBranch,
        title: "Git Integration",
        description:
            "Sync with GitHub, track changes, and manage versions with built-in Git support.",
    },
    {
        icon: Eye,
        title: "Live Preview",
        description:
            "See your PDF update instantly as you type. No more waiting for compilation.",
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description:
            "Your documents are encrypted and stored securely. We respect your privacy.",
    },
    {
        icon: Globe,
        title: "Open Source",
        description:
            "Built in the open. Self-host if you want, or use our managed service.",
    },
];

const collaborationFeatures = [
    "See teammate cursors and selections in real-time",
    "Built-in chat and comments for discussions",
    "Presence indicators show who's online",
    "Conflict-free collaborative editing with Yjs",
];

const aiFeatures = [
    "Fix LaTeX errors automatically",
    "Generate equations from natural language",
    "Get writing suggestions and improvements",
    "Learn LaTeX with contextual help",
];

const gitFeatures = [
    "One-click GitHub repository sync",
    "Automatic version history and snapshots",
    "Branch and merge with confidence",
    "Integrate with your existing workflow",
];

const pricingTiers = [
    {
        name: "Free",
        price: "$0",
        period: "/month",
        description: "Perfect for getting started",
        features: [
            "Up to 3 projects",
            "Real-time collaboration",
            "Basic AI assistance",
            "Community support",
        ],
        cta: "Get Started",
        ctaLink: "/signup",
        popular: false,
    },
    {
        name: "Pro",
        price: "$12",
        period: "/month",
        description: "For serious LaTeX users",
        features: [
            "Unlimited projects",
            "Advanced AI features",
            "Git integration",
            "Priority support",
            "Custom templates",
        ],
        cta: "Start Free Trial",
        ctaLink: "/signup",
        popular: true,
    },
    {
        name: "Team",
        price: "$39",
        period: "/month",
        description: "For research teams",
        features: [
            "Everything in Pro",
            "Team management",
            "Shared templates",
            "SSO & SAML",
            "Dedicated support",
        ],
        cta: "Contact Sales",
        ctaLink: "#",
        popular: false,
    },
];

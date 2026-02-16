import Link from "next/link";
import { FileText, Check, ArrowRight, Sparkles } from "lucide-react";

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
            "PDF compilation",
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
        cta: "Start Free Trial",
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

const comparison = [
    { feature: "Projects", free: "5", pro: "Unlimited", team: "Unlimited" },
    { feature: "Collaborators", free: "2", pro: "Unlimited", team: "50+" },
    { feature: "Compile timeout", free: "1 min", pro: "4 min", team: "4 min" },
    { feature: "AI calls", free: "5/day", pro: "Unlimited", team: "Unlimited" },
    { feature: "GitHub sync", free: "—", pro: "✓", team: "✓" },
    { feature: "Templates", free: "Basic", pro: "All + custom", team: "All + shared library" },
    { feature: "Version history", free: "Last 5", pro: "Unlimited", team: "Unlimited" },
    { feature: "Export formats", free: "PDF", pro: "PDF, TeX, ZIP", team: "PDF, TeX, ZIP" },
    { feature: "Admin dashboard", free: "—", pro: "—", team: "✓" },
    { feature: "SSO", free: "—", pro: "—", team: "Coming soon" },
    { feature: "Support", free: "Community", pro: "Priority", team: "Dedicated" },
];

export default function PricingPage() {
    return (
        <div className="min-h-dvh flex flex-col">
            {/* Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="gradient-text">LatexForge</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="btn-secondary text-sm px-4 py-2">
                            Sign In
                        </Link>
                        <Link href="/signup" className="btn-primary text-sm px-4 py-2">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 px-6 pt-32 pb-20">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-[var(--color-surface-700)] mb-6">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        14-day free trial on Pro
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                        Simple, transparent{" "}
                        <span className="gradient-text">pricing</span>
                    </h1>
                    <p className="text-lg text-[var(--color-surface-600)] max-w-xl mx-auto">
                        Start free, upgrade when you need unlimited AI power and team features.
                        No hidden fees.
                    </p>
                </div>

                {/* Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
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
                            <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                            <p className="text-sm text-[var(--color-surface-500)] mb-5">
                                {tier.description}
                            </p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-extrabold">{tier.price}</span>
                                <span className="text-sm text-[var(--color-surface-500)]">
                                    {tier.period}
                                </span>
                            </div>
                            <Link
                                href={tier.href}
                                className={`block w-full text-center py-3 px-4 rounded-lg text-sm font-medium transition-colors mb-6 ${tier.highlight
                                    ? "bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)]"
                                    : "glass glass-hover"
                                    }`}
                            >
                                {tier.cta}
                            </Link>
                            <ul className="space-y-3">
                                {tier.features.map((f) => (
                                    <li
                                        key={f}
                                        className="flex items-start gap-2 text-sm text-[var(--color-surface-600)]"
                                    >
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">
                        Feature comparison
                    </h2>
                    <div className="overflow-x-auto rounded-2xl glass">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-glass-border)]">
                                    <th className="text-left p-4 font-medium text-[var(--color-surface-500)]">
                                        Feature
                                    </th>
                                    <th className="text-center p-4 font-semibold">Free</th>
                                    <th className="text-center p-4 font-semibold text-[var(--color-accent-400)]">
                                        Pro
                                    </th>
                                    <th className="text-center p-4 font-semibold">Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map((row, i) => (
                                    <tr
                                        key={row.feature}
                                        className={
                                            i < comparison.length - 1
                                                ? "border-b border-[var(--color-glass-border)]"
                                                : ""
                                        }
                                    >
                                        <td className="p-4 font-medium">{row.feature}</td>
                                        <td className="p-4 text-center text-[var(--color-surface-500)]">
                                            {row.free}
                                        </td>
                                        <td className="p-4 text-center">{row.pro}</td>
                                        <td className="p-4 text-center">{row.team}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--color-glass-border)] py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-surface-500)]">
                    <span>&copy; {new Date().getFullYear()} LatexForge. Open Source.</span>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="hover:text-[var(--color-accent-400)] transition-colors">
                            Home
                        </Link>
                        <a
                            href="https://github.com/slegiot/latexeditor"
                            className="hover:text-[var(--color-accent-400)] transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

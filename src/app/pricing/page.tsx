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
        <div className="min-h-screen bg-surface-950">
            {/* Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-surface-800/50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
                        <FileText className="w-5 h-5 text-accent-400" />
                        <span>LatexForge</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                        <Link href="/signup" className="btn-primary text-sm gap-1.5">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-28 pb-20 px-6">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/10 text-accent-400 text-xs font-medium mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Start free, upgrade anytime
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-surface-400">
                        Start free, upgrade when you need unlimited AI power and team features.
                        No hidden fees.
                    </p>
                </div>

                {/* Tier Cards */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
                    {tiers.map((tier, i) => (
                        <div
                            key={tier.name}
                            className={`relative glass rounded-2xl p-6 flex flex-col animate-slide-up ${tier.highlight
                                    ? "ring-2 ring-accent-500/50 shadow-lg shadow-accent-500/10"
                                    : ""
                                }`}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {tier.highlight && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-semibold">
                                    Most Popular
                                </span>
                            )}
                            <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                            <p className="text-sm text-surface-400 mt-1">{tier.description}</p>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-bold text-white">{tier.price}</span>
                                <span className="text-sm text-surface-500 ml-1">{tier.period}</span>
                            </div>
                            <Link
                                href={tier.href}
                                className={`${tier.highlight ? "btn-primary" : "btn-secondary"} text-sm justify-center w-full`}
                            >
                                {tier.cta}
                            </Link>
                            <ul className="mt-6 space-y-2.5 flex-1">
                                {tier.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-surface-300">
                                        <Check className={`w-4 h-4 shrink-0 ${tier.highlight ? "text-accent-400" : "text-surface-500"}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Feature comparison</h2>
                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-800/50">
                                    <th className="text-left text-xs font-semibold text-surface-400 px-6 py-3 uppercase tracking-wider">Feature</th>
                                    <th className="text-center text-xs font-semibold text-surface-400 px-4 py-3 uppercase tracking-wider">Free</th>
                                    <th className="text-center text-xs font-semibold text-accent-400 px-4 py-3 uppercase tracking-wider">Pro</th>
                                    <th className="text-center text-xs font-semibold text-surface-400 px-4 py-3 uppercase tracking-wider">Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map((row, i) => (
                                    <tr key={row.feature} className={`border-b border-surface-800/30 ${i % 2 === 0 ? "bg-surface-900/20" : ""}`}>
                                        <td className="text-sm text-surface-300 px-6 py-3 font-medium">{row.feature}</td>
                                        <td className="text-sm text-surface-500 px-4 py-3 text-center">{row.free}</td>
                                        <td className="text-sm text-accent-400 px-4 py-3 text-center font-medium">{row.pro}</td>
                                        <td className="text-sm text-surface-400 px-4 py-3 text-center">{row.team}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-surface-800/50 py-8 px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-surface-500">
                    <span>&copy; {new Date().getFullYear()} LatexForge. Open Source.</span>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:text-surface-300 transition-colors">Home</Link>
                        <a href="https://github.com/slegiot/latexeditor" className="hover:text-surface-300 transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

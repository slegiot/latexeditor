import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
    Check,
    X,
    Sparkles,
    Zap,
    Building2,
    ArrowRight,
    HelpCircle,
} from "lucide-react";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>Simple, transparent pricing</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            Choose Your Plan
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                            Start free and scale as you grow. All plans include core features
                            with no hidden fees.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`card relative ${plan.popular
                                        ? "border-emerald-500/50 ring-1 ring-emerald-500/20 scale-105"
                                        : ""
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                                            <Sparkles className="w-3 h-3" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="p-8">
                                    {/* Plan Header */}
                                    <div className="mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                            <plan.icon className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            {plan.period && (
                                                <span className="text-[var(--text-muted)]">
                                                    {plan.period}
                                                </span>
                                            )}
                                        </div>
                                        {plan.price !== "Free" && (
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                Billed monthly or ${plan.yearlyPrice}/year
                                            </p>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <Link
                                        href={plan.ctaLink}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all mb-8 ${plan.popular
                                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-secondary)]"
                                            }`}
                                    >
                                        {plan.cta}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>

                                    {/* Features */}
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                                            What's included:
                                        </p>
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                        {plan.notIncluded?.map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-start gap-3 opacity-50"
                                            >
                                                <X className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-[var(--text-muted)]">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Comparison */}
                    <div className="card p-8 mb-16">
                        <h2 className="text-2xl font-bold text-center mb-8">
                            Feature Comparison
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <th className="text-left py-4 px-4 font-medium">Feature</th>
                                        <th className="text-center py-4 px-4 font-medium">Free</th>
                                        <th className="text-center py-4 px-4 font-medium text-emerald-400">
                                            Pro
                                        </th>
                                        <th className="text-center py-4 px-4 font-medium">Team</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {features.map((feature, index) => (
                                        <tr
                                            key={feature.name}
                                            className={`${index !== features.length - 1
                                                    ? "border-b border-[var(--border-secondary)]"
                                                    : ""
                                                }`}
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[var(--text-secondary)]">
                                                        {feature.name}
                                                    </span>
                                                    {feature.tooltip && (
                                                        <div className="group relative">
                                                            <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-xs text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                {feature.tooltip}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center py-4 px-4 text-[var(--text-secondary)]">
                                                {feature.free}
                                            </td>
                                            <td className="text-center py-4 px-4 text-emerald-400 font-medium">
                                                {feature.pro}
                                            </td>
                                            <td className="text-center py-4 px-4 text-[var(--text-secondary)]">
                                                {feature.team}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-8">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            {faqs.map((faq) => (
                                <div
                                    key={faq.question}
                                    className="card p-6 hover:border-emerald-500/30 transition-colors"
                                >
                                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 text-center">
                        <h2 className="text-2xl font-bold mb-4">
                            Ready to start writing?
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Join thousands of researchers and students using LaTeX Forge.
                        </p>
                        <Link href="/signup" className="btn-primary text-base px-8 py-4">
                            <Zap className="w-5 h-5" />
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

const plans = [
    {
        name: "Free",
        description: "Perfect for getting started",
        price: "$0",
        period: "/month",
        yearlyPrice: "0",
        icon: Zap,
        features: [
            "Up to 3 projects",
            "Real-time collaboration",
            "Basic AI assistance",
            "GitHub integration",
            "Community support",
        ],
        notIncluded: ["Advanced AI features", "Priority support", "Custom templates"],
        cta: "Get Started",
        ctaLink: "/signup",
        popular: false,
    },
    {
        name: "Pro",
        description: "For serious LaTeX users",
        price: "$12",
        period: "/month",
        yearlyPrice: "120",
        icon: Sparkles,
        features: [
            "Unlimited projects",
            "Advanced AI features",
            "Git integration",
            "Custom templates",
            "Priority support",
            "Version history",
        ],
        cta: "Start Free Trial",
        ctaLink: "/signup",
        popular: true,
    },
    {
        name: "Team",
        description: "For research teams",
        price: "$39",
        period: "/month",
        yearlyPrice: "390",
        icon: Building2,
        features: [
            "Everything in Pro",
            "Team management",
            "Shared templates",
            "SSO & SAML",
            "Dedicated support",
            "Custom integrations",
        ],
        cta: "Contact Sales",
        ctaLink: "mailto:sales@latexforge.com",
        popular: false,
    },
];

const features = [
    {
        name: "Projects",
        free: "3",
        pro: "Unlimited",
        team: "Unlimited",
    },
    {
        name: "Collaborators",
        free: "2 per project",
        pro: "10 per project",
        team: "Unlimited",
    },
    {
        name: "AI Assistance",
        free: "Basic",
        pro: "Advanced",
        team: "Advanced",
        tooltip: "AI-powered error fixing and content generation",
    },
    {
        name: "Git Integration",
        free: "GitHub only",
        pro: "Full Git support",
        team: "Full Git support",
    },
    {
        name: "Version History",
        free: "7 days",
        pro: "Unlimited",
        team: "Unlimited",
    },
    {
        name: "Storage",
        free: "100 MB",
        pro: "1 GB",
        team: "10 GB",
    },
    {
        name: "Export Formats",
        free: "PDF",
        pro: "PDF, ZIP, Source",
        team: "All formats",
    },
    {
        name: "Support",
        free: "Community",
        pro: "Priority email",
        team: "Dedicated",
    },
];

const faqs = [
    {
        question: "Can I switch plans at any time?",
        answer:
            "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, you'll keep your current plan until the end of the billing period.",
    },
    {
        question: "Is there a free trial for Pro?",
        answer:
            "Yes! We offer a 14-day free trial of Pro features. No credit card required to start.",
    },
    {
        question: "What happens to my projects if I downgrade?",
        answer:
            "Your projects remain accessible, but you won't be able to create new ones if you've exceeded the free plan limit. We never delete your work.",
    },
    {
        question: "Do you offer student discounts?",
        answer:
            "Yes! Students and educators can get 50% off Pro plans. Contact us with your .edu email for verification.",
    },
    {
        question: "Can I self-host LaTeX Forge?",
        answer:
            "Yes! LaTeX Forge is open source. You can self-host it for free. Check our GitHub repository for installation instructions.",
    },
];

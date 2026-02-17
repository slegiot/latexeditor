"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import {
    Code2,
    Menu,
    X,
    Github,
    LogIn,
    UserPlus,
    ChevronDown,
} from "lucide-react";

interface NavbarProps {
    showNavLinks?: boolean;
}

export function Navbar({ showNavLinks = true }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-[var(--border-secondary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-[var(--text-primary)]">
                            LaTeX Forge
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    {showNavLinks && (
                        <div className="hidden md:flex items-center gap-1">
                            <NavLink href="/#features">Features</NavLink>
                            <NavLink href="/pricing">Pricing</NavLink>
                            <NavLink href="/dashboard">Dashboard</NavLink>
                            <a
                                href="https://github.com/slegiot/latexeditor"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
                            >
                                <Github className="w-4 h-4" />
                                <span>GitHub</span>
                            </a>
                        </div>
                    )}

                    {/* Right Side Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        <div className="h-6 w-px bg-[var(--border-primary)]" />
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="btn-primary text-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden glass-strong border-t border-[var(--border-secondary)] animate-slide-down">
                    <div className="px-4 py-4 space-y-2">
                        {showNavLinks && (
                            <>
                                <MobileNavLink
                                    href="/#features"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Features
                                </MobileNavLink>
                                <MobileNavLink
                                    href="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Pricing
                                </MobileNavLink>
                                <MobileNavLink
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </MobileNavLink>
                                <a
                                    href="https://github.com/slegiot/latexeditor"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <Github className="w-5 h-5" />
                                    GitHub
                                </a>
                            </>
                        )}
                        <div className="pt-4 border-t border-[var(--border-secondary)] space-y-2">
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <UserPlus className="w-5 h-5" />
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

function NavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
        >
            {children}
        </Link>
    );
}

function MobileNavLink({
    href,
    onClick,
    children,
}: {
    href: string;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
            {children}
        </Link>
    );
}

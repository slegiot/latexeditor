"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
    FileText,
    User,
    LogOut,
    ChevronDown,
    Settings,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
    user: {
        email: string;
        fullName: string;
        avatarUrl: string;
    };
}

export function Navbar({ user }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const initials = user.fullName
        ? user.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email?.[0]?.toUpperCase() ?? "U";

    return (
        <nav className="fixed top-0 inset-x-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-bold"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="gradient-text hidden sm:inline">LatexForge</span>
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {/* User menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass glass-hover transition-all"
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt=""
                                    className="w-7 h-7 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent-500)] to-[var(--color-accent-700)] flex items-center justify-center text-white text-xs font-bold">
                                    {initials}
                                </div>
                            )}
                            <span className="text-sm font-medium hidden sm:inline max-w-[120px] truncate">
                                {user.fullName || user.email}
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 text-[var(--color-surface-500)] transition-transform ${menuOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {/* Dropdown */}
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl overflow-hidden animate-scale-in origin-top-right shadow-[var(--shadow-card)]">
                                <div className="px-4 py-3 border-b border-[var(--color-glass-border)]">
                                    <p className="text-sm font-medium truncate">
                                        {user.fullName || "User"}
                                    </p>
                                    <p className="text-xs text-[var(--color-surface-500)] truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <div className="py-1">
                                    <Link
                                        href="/settings"
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--color-glass-hover)] transition-colors"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <Settings className="w-4 h-4 text-[var(--color-surface-500)]" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

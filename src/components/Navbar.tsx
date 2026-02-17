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
    } | null;
}

export function Navbar({ user }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-800/50 h-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
                    <FileText className="w-5 h-5 text-accent-400" />
                    <span>LatexForge</span>
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {user ? (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2 btn-ghost py-1.5 px-2"
                                aria-label="User menu"
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.fullName}
                                        width={28}
                                        height={28}
                                        className="w-7 h-7 rounded-full ring-2 ring-surface-700"
                                    />
                                ) : (
                                    <span className="w-7 h-7 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-sm font-semibold">
                                        {user.fullName?.[0] || user.email[0]}
                                    </span>
                                )}
                                <span className="text-sm text-surface-300 hidden sm:block max-w-[120px] truncate">
                                    {user.fullName || user.email}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl py-1 shadow-2xl animate-scale-in origin-top-right z-50">
                                    <div className="px-4 py-3 border-b border-surface-800/50">
                                        <p className="text-sm font-medium text-white truncate">{user.fullName || "User"}</p>
                                        <p className="text-xs text-surface-500 truncate">{user.email}</p>
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-800/50 hover:text-white transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        My Projects
                                    </Link>
                                    <Link
                                        href="/settings"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-800/50 hover:text-white transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </Link>
                                    <hr className="border-surface-800/50 my-1" />
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 w-full transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                            <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

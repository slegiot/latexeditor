"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const stored = localStorage.getItem("latexforge-theme") as
            | "dark"
            | "light"
            | null;
        if (stored) {
            setTheme(stored);
        } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
            setTheme("light");
        }
    }, []);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("latexforge-theme", next);
        document.documentElement.className = next;
    };

    return (
        <button
            onClick={toggle}
            className="p-2 rounded-xl glass glass-hover transition-all group"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            <div className="relative w-4.5 h-4.5">
                {theme === "dark" ? (
                    <Sun className="w-4.5 h-4.5 text-[var(--color-surface-600)] group-hover:text-amber-400 transition-colors" />
                ) : (
                    <Moon className="w-4.5 h-4.5 text-[var(--color-surface-600)] group-hover:text-indigo-400 transition-colors" />
                )}
            </div>
        </button>
    );
}

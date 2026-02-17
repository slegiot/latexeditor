"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("light", savedTheme === "light");
            document.documentElement.classList.toggle("dark", savedTheme !== "light");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("light", newTheme === "light");
        document.documentElement.classList.toggle("dark", newTheme !== "light");
    };

    return (
        <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-lg"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px] text-surface-400 hover:text-yellow-400 transition-colors" />
            ) : (
                <Moon className="w-[18px] h-[18px] text-surface-500 hover:text-surface-700 transition-colors" />
            )}
        </button>
    );
}

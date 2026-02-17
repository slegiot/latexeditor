import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "LaTeX Forge - Modern Collaborative LaTeX Editor",
    description:
        "A powerful, open-source Overleaf alternative with real-time collaboration, AI assistance, and Git integration. Write LaTeX documents together, seamlessly.",
    keywords: [
        "LaTeX",
        "editor",
        "collaboration",
        "real-time",
        "Overleaf alternative",
        "academic writing",
        "research",
        "typesetting",
    ],
    authors: [{ name: "LaTeX Forge Team" }],
    openGraph: {
        title: "LaTeX Forge - Modern Collaborative LaTeX Editor",
        description:
            "Write LaTeX documents together with real-time collaboration, AI assistance, and Git integration.",
        type: "website",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "LaTeX Forge - Modern Collaborative LaTeX Editor",
        description:
            "Write LaTeX documents together with real-time collaboration, AI assistance, and Git integration.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#0c1117" },
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${jetbrainsMono.variable} dark`}
            suppressHydrationWarning
        >
            <body className="antialiased min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <PostHogProvider>
                    {children}
                </PostHogProvider>
            </body>
        </html>
    );
}

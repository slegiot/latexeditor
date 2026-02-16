import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PostHogProvider } from "@/components/PostHogProvider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "LatexForge — Collaborative LaTeX Editor",
    description:
        "Write, compile, and collaborate on LaTeX documents in real-time. An open-source Overleaf alternative powered by modern web technologies.",
    keywords: ["LaTeX", "editor", "collaborative", "PDF", "academic", "research"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                const theme = localStorage.getItem('latexforge-theme') || 'dark';
                document.documentElement.className = theme;
              })();
            `,
                    }}
                />
            </head>
            <body className={`${inter.variable} antialiased`}>
                <PostHogProvider>
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </PostHogProvider>
            </body>
        </html>
    );
}

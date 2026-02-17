import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PostHogProvider } from "@/components/PostHogProvider";

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
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
                {/* Prevent FOUC: apply saved theme before paint */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light')}}catch(e){}})();`,
                    }}
                />
            </head>
            <body className="font-sans antialiased bg-surface-950 text-surface-100 min-h-screen">
                <PostHogProvider>
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </PostHogProvider>
            </body>
        </html>
    );
}

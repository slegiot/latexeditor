"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileArchive, FileText, Loader2 } from "lucide-react";

interface ExportMenuProps {
    projectId: string;
    pdfUrl: string | null;
}

export function ExportMenu({ projectId, pdfUrl }: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function downloadZip() {
        setLoading("zip");
        try {
            const res = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, format: "zip" }),
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `project-${projectId.slice(0, 8)}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("ZIP export error:", err);
        } finally {
            setLoading(null);
            setOpen(false);
        }
    }

    async function downloadPdf() {
        if (pdfUrl) {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "document.pdf";
            a.click();
            setOpen(false);
            return;
        }

        setLoading("pdf");
        try {
            const res = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, format: "pdf" }),
            });
            const data = await res.json();
            if (data.pdfUrl) {
                const a = document.createElement("a");
                a.href = data.pdfUrl;
                a.download = "document.pdf";
                a.click();
            }
        } catch (err) {
            console.error("PDF export error:", err);
        } finally {
            setLoading(null);
            setOpen(false);
        }
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                title="Export"
                className={`btn-ghost text-xs gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${open ? "bg-accent-500/15 text-accent-400" : ""}`}
            >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Export</span>
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 w-48 glass rounded-xl border border-surface-800/50 shadow-2xl z-40 overflow-hidden animate-scale-in origin-top-left p-1">
                    <button
                        onClick={downloadZip}
                        disabled={!!loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-300 rounded-lg hover:bg-surface-800/40 transition-colors"
                    >
                        {loading === "zip" ? <Loader2 className="w-4 h-4 icon-spin" /> : <FileArchive className="w-4 h-4 text-amber-400" />}
                        Download ZIP
                    </button>

                    <button
                        onClick={downloadPdf}
                        disabled={!!loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-300 rounded-lg hover:bg-surface-800/40 transition-colors"
                    >
                        {loading === "pdf" ? <Loader2 className="w-4 h-4 icon-spin" /> : <FileText className="w-4 h-4 text-red-400" />}
                        Download PDF
                    </button>
                </div>
            )}
        </div>
    );
}

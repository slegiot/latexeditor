"use client";

import { Download, FileText, FileCode, Archive } from "lucide-react";

interface ExportMenuProps {
    pdfUrl: string | null;
    onClose: () => void;
}

export function ExportMenu({ pdfUrl, onClose }: ExportMenuProps) {
    const handleDownloadPDF = () => {
        if (pdfUrl) {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = "document.pdf";
            link.click();
        }
        onClose();
    };

    const handleDownloadSource = () => {
        // TODO: Implement source download
        console.log("Download source");
        onClose();
    };

    const handleDownloadZip = () => {
        // TODO: Implement zip download
        console.log("Download zip");
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute right-0 top-full mt-1 w-56 py-1 rounded-lg glass-strong border border-[var(--border-primary)] shadow-xl z-50 animate-scale-in">
                <div className="px-3 py-2 text-xs text-[var(--text-muted)] uppercase tracking-wider">
                    Export Options
                </div>

                <button
                    onClick={handleDownloadPDF}
                    disabled={!pdfUrl}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileText className="w-4 h-4 text-red-400" />
                    <div className="text-left">
                        <p className="font-medium">Download PDF</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Compiled document
                        </p>
                    </div>
                </button>

                <button
                    onClick={handleDownloadSource}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                        <p className="font-medium">Download Source</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            .tex files only
                        </p>
                    </div>
                </button>

                <button
                    onClick={handleDownloadZip}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                    <Archive className="w-4 h-4 text-yellow-400" />
                    <div className="text-left">
                        <p className="font-medium">Download ZIP</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Complete project
                        </p>
                    </div>
                </button>
            </div>
        </>
    );
}

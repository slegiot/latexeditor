"use client";

import { useEffect, useState, useCallback } from "react";
import {
    FileText,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Cpu,
} from "lucide-react";
import type { editor as MonacoEditor } from "monaco-editor";

interface StatusBarProps {
    compiling: boolean;
    hasCompiledPdf: boolean;
    errorCount: number;
    warningCount: number;
    editorRef: React.RefObject<MonacoEditor.IStandaloneCodeEditor | null>;
    fileName?: string;
}

export function StatusBar({
    compiling,
    hasCompiledPdf,
    errorCount,
    warningCount,
    editorRef,
    fileName = "main.tex",
}: StatusBarProps) {
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [wordCount, setWordCount] = useState(0);
    const [compileTime, setCompileTime] = useState<number | null>(null);

    // Track cursor position
    useEffect(() => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const position = editor.getPosition();

        if (position) {
            setCursorPosition({ line: position.lineNumber, column: position.column });
        }

        const disposable = editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
            setCursorPosition({
                line: e.position.lineNumber,
                column: e.position.column,
            });
        });

        return () => disposable.dispose();
    }, [editorRef]);

    // Track word count
    useEffect(() => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const model = editor.getModel();

        if (!model) return;

        const updateWordCount = () => {
            const content = model.getValue();
            const words = content.trim().split(/\s+/).filter(Boolean).length;
            setWordCount(words);
        };

        updateWordCount();

        const disposable = model.onDidChangeContent(() => {
            updateWordCount();
        });

        return () => disposable.dispose();
    }, [editorRef]);

    // Store compile time when compilation completes
    useEffect(() => {
        if (!compiling && hasCompiledPdf && compileTime === null) {
            // Compile just finished - we could track this via a prop
            // For now, just show last compile time
        }
    }, [compiling, hasCompiledPdf, compileTime]);

    return (
        <footer className="h-7 flex items-center justify-between px-3 border-t border-[var(--color-glass-border)] bg-[var(--color-surface-100)] text-[11px] shrink-0">
            {/* Left section */}
            <div className="flex items-center gap-4">
                {/* File info */}
                <div className="flex items-center gap-1.5 text-[var(--color-surface-500)]">
                    <FileText className="w-3 h-3" />
                    <span className="font-medium">{fileName}</span>
                </div>

                {/* Compile status */}
                <div className="flex items-center gap-1.5">
                    {compiling ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin text-[var(--color-accent-400)]" />
                            <span className="text-[var(--color-accent-400)]">Compiling...</span>
                        </>
                    ) : hasCompiledPdf ? (
                        <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Compiled</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-[var(--color-surface-400)]" />
                            <span className="text-[var(--color-surface-500)]">Ready</span>
                        </>
                    )}
                </div>

                {/* Errors/Warnings */}
                {(errorCount > 0 || warningCount > 0) && (
                    <div className="flex items-center gap-2">
                        {errorCount > 0 && (
                            <div className="flex items-center gap-1 text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{errorCount} error{errorCount !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                        {warningCount > 0 && (
                            <div className="flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{warningCount} warning{warningCount !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 text-[var(--color-surface-500)]">
                {/* Word count */}
                <div className="hidden sm:flex items-center gap-1.5 px-2">
                    <span>{wordCount.toLocaleString()} words</span>
                </div>

                <span className="hidden sm:block text-[var(--color-surface-300)]">·</span>

                {/* Cursor position */}
                <div className="flex items-center gap-1.5 px-2">
                    <span>Ln {cursorPosition.line}</span>
                    <span className="text-[var(--color-surface-400)]">:</span>
                    <span>Col {cursorPosition.column}</span>
                </div>

                <span className="hidden md:block text-[var(--color-surface-300)]">·</span>

                {/* Encoding */}
                <div className="hidden md:flex items-center px-2">
                    <span>UTF-8</span>
                </div>

                <span className="hidden md:block text-[var(--color-surface-300)]">·</span>

                {/* Tab size */}
                <div className="hidden md:flex items-center px-2">
                    <span>Spaces: 2</span>
                </div>

                <span className="hidden md:block text-[var(--color-surface-300)]">·</span>

                {/* LaTeX engine indicator */}
                <div className="hidden md:flex items-center gap-1.5 px-2">
                    <Cpu className="w-3 h-3" />
                    <span>pdfLaTeX</span>
                </div>
            </div>
        </footer>
    );
}

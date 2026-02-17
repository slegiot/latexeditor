"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { editor as MonacoEditor } from "monaco-editor";

interface StatusBarProps {
    compiling: boolean;
    hasCompiledPdf: boolean;
    errorCount: number;
    warningCount: number;
    editorRef: React.RefObject<MonacoEditor.IStandaloneCodeEditor | null>;
    fileName: string;
}

export function StatusBar({
    compiling,
    hasCompiledPdf,
    errorCount,
    warningCount,
    editorRef,
    fileName,
}: StatusBarProps) {
    const [line, setLine] = useState(1);
    const [col, setCol] = useState(1);
    const [wordCount, setWordCount] = useState(0);

    // Listen for cursor position changes
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const disposable = editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
            setLine(e.position.lineNumber);
            setCol(e.position.column);
        });

        return () => disposable.dispose();
    }, [editorRef]);

    // Listen for content changes (word count)
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const updateWordCount = () => {
            const model = editor.getModel();
            if (model) {
                const text = model.getValue();
                const words = text
                    .replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, "")
                    .replace(/[{}\\[\]$%&]/g, "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean);
                setWordCount(words.length);
            }
        };

        updateWordCount();
        const disposable = editor.onDidChangeModelContent(() => {
            updateWordCount();
        });

        return () => disposable.dispose();
    }, [editorRef]);

    const getStatusText = () => {
        if (compiling) return "Compiling…";
        if (hasCompiledPdf) return "Compiled";
        return "Ready";
    };

    const getStatusColor = () => {
        if (compiling) return "text-warning";
        if (errorCount > 0) return "text-danger";
        if (hasCompiledPdf) return "text-success";
        return "text-surface-500";
    };

    const getStatusDot = () => {
        if (compiling) return "bg-warning";
        if (errorCount > 0) return "bg-danger";
        if (hasCompiledPdf) return "bg-success";
        return "bg-surface-600";
    };

    return (
        <div
            role="status"
            aria-label="Editor status bar"
            className="h-6 bg-surface-900/90 border-t border-surface-800/50 flex items-center justify-between px-3 text-[11px] text-surface-500 shrink-0 select-none"
        >
            <div className="flex items-center gap-3">
                <span className="font-medium text-surface-400">{fileName}</span>

                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot()} ${compiling ? "animate-pulse" : ""}`} />
                    <span className={getStatusColor()}>{getStatusText()}</span>
                </div>

                {errorCount > 0 && (
                    <span className="text-danger font-medium">
                        {errorCount} error{errorCount !== 1 ? "s" : ""}
                    </span>
                )}
                {warningCount > 0 && (
                    <span className="text-warning font-medium">
                        {warningCount} warning{warningCount !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4">
                <span>Ln {line}, Col {col}</span>
                <span>{wordCount} words</span>
                <span className="text-surface-600">pdfLaTeX</span>
            </div>
        </div>
    );
}

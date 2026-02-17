"use client";

import { useState, useEffect, useRef } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import {
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Loader2,
    Type,
    FileCode,
    Clock,
} from "lucide-react";

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
    const [position, setPosition] = useState({ line: 1, column: 1 });
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const updatePosition = () => {
            const pos = editor.getPosition();
            if (pos) {
                setPosition({ line: pos.lineNumber, column: pos.column });
            }
        };

        const updateCounts = () => {
            const model = editor.getModel();
            if (model) {
                const content = model.getValue();
                setCharCount(content.length);
                // Simple word count - split by whitespace
                const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
                setWordCount(words.length);
            }
        };

        // Update on cursor position change
        const disposable = editor.onDidChangeCursorPosition(updatePosition);

        // Update counts on content change
        const contentDisposable = editor.onDidChangeModelContent(updateCounts);

        // Initial update
        updatePosition();
        updateCounts();

        return () => {
            disposable.dispose();
            contentDisposable.dispose();
        };
    }, [editorRef]);

    const getCompileStatus = () => {
        if (compiling) {
            return (
                <>
                    <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
                    <span className="text-yellow-400">Compiling...</span>
                </>
            );
        }
        if (errorCount > 0) {
            return (
                <>
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">
                        {errorCount} error{errorCount !== 1 ? "s" : ""}
                    </span>
                </>
            );
        }
        if (warningCount > 0) {
            return (
                <>
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">
                        {warningCount} warning{warningCount !== 1 ? "s" : ""}
                    </span>
                </>
            );
        }
        if (hasCompiledPdf) {
            return (
                <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Compiled</span>
                </>
            );
        }
        return (
            <>
                <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[var(--text-muted)]">Ready</span>
            </>
        );
    };

    return (
        <div className="h-7 bg-[var(--bg-secondary)] border-t border-[var(--border-secondary)] flex items-center px-3 text-xs">
            {/* Left Section - Compile Status */}
            <div className="flex items-center gap-2">
                {getCompileStatus()}
            </div>

            {/* Center - Spacer */}
            <div className="flex-1" />

            {/* Right Section - Editor Info */}
            <div className="flex items-center gap-4">
                {/* File Info */}
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <FileCode className="w-3 h-3" />
                    <span>{fileName}</span>
                </div>

                {/* Position */}
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span>Ln {position.line}</span>
                    <span>Col {position.column}</span>
                </div>

                {/* Word Count */}
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <Type className="w-3 h-3" />
                    <span>{wordCount.toLocaleString()} words</span>
                </div>

                {/* Encoding */}
                <div className="hidden sm:flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span>UTF-8</span>
                </div>
            </div>
        </div>
    );
}

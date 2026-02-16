"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor, MarkerSeverity } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { EditorToolbar } from "./EditorToolbar";
import { HistoryPanel } from "./HistoryPanel";
import { AISidebar } from "./AISidebar";
import { createAutoSave, getDraft, deleteDraft } from "@/lib/drafts";
import {
    LATEX_LANGUAGE_ID,
    latexLanguageConfig,
    latexTokensProvider,
    latexSnippets,
} from "@/lib/latex-language";
import type { LatexError } from "@/lib/latex-errors";
import { createBrowserClient } from "@supabase/ssr";
import { useYjs } from "@/hooks/useYjs";

interface EditorPageProps {
    project: {
        id: string;
        name: string;
        description: string;
    };
    initialContent: string;
    documentId?: string;
    user: {
        name: string;
        email: string;
    };
    accessToken: string;
    githubConnected: boolean;
    githubRepoUrl?: string | null;
}

export function EditorPage({
    project,
    initialContent,
    documentId,
    user,
    accessToken,
    githubConnected,
    githubRepoUrl,
}: EditorPageProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [compiling, setCompiling] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<
        "saved" | "unsaved" | "saving" | "error"
    >("saved");
    const [errors, setErrors] = useState<LatexError[]>([]);
    const [offlineDraft, setOfflineDraft] = useState(false);
    const [dividerPos, setDividerPos] = useState(50);
    const [showPdf, setShowPdf] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [aiMode, setAiMode] = useState<"fix" | "generate">("fix");

    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const isDragging = useRef(false);

    // ── Yjs collaboration ──
    const {
        connected,
        peers,
        getYText,
        getDoc,
        getAwareness,
        getContent,
        userColor,
    } = useYjs({
        projectId: project.id,
        accessToken,
        user,
    });

    // Auto-save to IndexedDB (offline fallback)
    const autoSave = useMemo(
        () => createAutoSave(project.id, 3000),
        [project.id]
    );

    // Check for offline draft on mount
    useEffect(() => {
        async function checkDraft() {
            try {
                const draft = await getDraft(project.id);
                if (draft && draft.content !== initialContent) {
                    const useDraft = confirm(
                        `Found an unsaved offline draft from ${new Date(
                            draft.savedAt
                        ).toLocaleString()}. Use it instead of the server version?`
                    );
                    if (useDraft) {
                        // Insert draft into Yjs doc
                        const yText = getYText();
                        if (yText) {
                            const doc = getDoc();
                            doc?.transact(() => {
                                yText.delete(0, yText.length);
                                yText.insert(0, draft.content);
                            });
                        }
                        setOfflineDraft(true);
                        setSaveStatus("unsaved");
                    } else {
                        await deleteDraft(project.id);
                    }
                }
            } catch {
                // IndexedDB not available
            }
        }
        // Small delay to let Yjs connect and sync first
        const timeout = setTimeout(checkDraft, 2000);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for Yjs content changes → auto-save to IndexedDB
    useEffect(() => {
        const yText = getYText();
        if (!yText) return;

        const observer = () => {
            const content = yText.toString();
            autoSave(content);
            setSaveStatus("unsaved");
        };

        yText.observe(observer);
        return () => yText.unobserve(observer);
    }, [getYText, autoSave]);

    // Register LaTeX language on Monaco mount
    const handleEditorMount: OnMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Register LaTeX language
        monaco.languages.register({ id: LATEX_LANGUAGE_ID });
        monaco.languages.setLanguageConfiguration(
            LATEX_LANGUAGE_ID,
            latexLanguageConfig
        );
        monaco.languages.setMonarchTokensProvider(
            LATEX_LANGUAGE_ID,
            latexTokensProvider
        );

        // Register snippet completions
        monaco.languages.registerCompletionItemProvider(LATEX_LANGUAGE_ID, {
            provideCompletionItems: (model: any, position: any) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };
                return {
                    suggestions: latexSnippets.map((s) => ({
                        label: s.label,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: s.insertText,
                        insertTextRules:
                            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: s.documentation,
                        range,
                    })),
                };
            },
        });

        // Custom theme
        monaco.editor.defineTheme("latexforge-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "comment", foreground: "6A9955", fontStyle: "italic" },
                { token: "keyword", foreground: "4EC9B0" },
                { token: "keyword.command", foreground: "569CD6" },
                {
                    token: "keyword.section",
                    foreground: "C586C0",
                    fontStyle: "bold",
                },
                { token: "keyword.formatting", foreground: "DCDCAA" },
                { token: "keyword.math", foreground: "CE9178" },
                { token: "keyword.math-command", foreground: "D7BA7D" },
                { token: "keyword.escape", foreground: "D4D4D4" },
                { token: "string.math", foreground: "CE9178" },
                { token: "delimiter.curly", foreground: "FFD700" },
                { token: "delimiter.bracket", foreground: "DA70D6" },
                { token: "number", foreground: "B5CEA8" },
            ],
            colors: {
                "editor.background": "#0c1117",
                "editor.foreground": "#D4D4D4",
                "editor.lineHighlightBackground": "#1a2332",
                "editorCursor.foreground": "#10B981",
                "editor.selectionBackground": "#10B98133",
                "editorLineNumber.foreground": "#3b4a5a",
                "editorLineNumber.activeForeground": "#8b9cb8",
            },
        });

        monaco.editor.setTheme("latexforge-dark");

        // ── Yjs ↔ Monaco binding ──
        const yText = getYText();
        const awareness = getAwareness();
        const model = editor.getModel();

        if (yText && model) {
            bindingRef.current = new MonacoBinding(
                yText,
                model,
                new Set([editor]),
                awareness ?? undefined
            );
        }

        // Keybindings
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                handleSave();
            }
        );
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => {
                handleCompile();
            }
        );

        editor.focus();
    };

    // Cleanup binding on unmount
    useEffect(() => {
        return () => {
            bindingRef.current?.destroy();
        };
    }, []);

    // Set error markers in Monaco
    const setEditorMarkers = useCallback((errs: LatexError[]) => {
        if (!editorRef.current || !monacoRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        const markers = errs.map((e) => ({
            severity:
                e.severity === "error"
                    ? (8 as MarkerSeverity)
                    : e.severity === "warning"
                        ? (4 as MarkerSeverity)
                        : (2 as MarkerSeverity),
            startLineNumber: Math.max(1, e.line),
            startColumn: e.column,
            endLineNumber: Math.max(1, e.line),
            endColumn: 1000,
            message: e.message,
            source: "pdflatex",
        }));

        monacoRef.current.editor.setModelMarkers(model, "pdflatex", markers);
    }, []);

    const clearMarkers = useCallback(() => {
        if (!editorRef.current || !monacoRef.current) return;
        const model = editorRef.current.getModel();
        if (model) {
            monacoRef.current.editor.setModelMarkers(model, "pdflatex", []);
        }
    }, []);

    // ── Compile ──
    const handleCompile = useCallback(async () => {
        if (compiling) return;
        setCompiling(true);
        clearMarkers();

        try {
            // Read content from Yjs doc
            const content = getContent();

            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    projectId: project.id,
                }),
            });

            const data = await res.json();

            if (data.pdfUrl) {
                setPdfUrl(`${data.pdfUrl}?t=${Date.now()}`);
                setShowPdf(true);
            }

            if (data.errors && data.errors.length > 0) {
                setErrors(data.errors);
                setEditorMarkers(data.errors);
            } else {
                setErrors([]);
            }
        } catch {
            setErrors([
                {
                    line: 1,
                    column: 1,
                    message: "Network error — could not reach compile server",
                    severity: "error",
                },
            ]);
        } finally {
            setCompiling(false);
        }
    }, [compiling, project.id, clearMarkers, setEditorMarkers, getContent]);

    // ── Save to Supabase ──
    const handleSave = useCallback(async () => {
        if (saving) return;
        setSaving(true);
        setSaveStatus("saving");

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const content = getContent();

            if (documentId) {
                await supabase
                    .from("documents")
                    .update({
                        content,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", documentId);
            } else {
                await supabase.from("documents").insert({
                    project_id: project.id,
                    title: "main.tex",
                    content,
                });
            }

            await supabase
                .from("projects")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", project.id);

            await deleteDraft(project.id);
            setOfflineDraft(false);
            setSaveStatus("saved");

            // Create version snapshot
            try {
                await fetch("/api/versions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId: project.id, content }),
                });
            } catch {
                // Silently fail — version history is non-critical
            }
        } catch {
            setSaveStatus("error");
        } finally {
            setSaving(false);
        }
    }, [saving, documentId, project.id, getContent]);

    // ── Resizable divider ──
    const handleMouseDown = useCallback(() => {
        isDragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const pct = (e.clientX / window.innerWidth) * 100;
            setDividerPos(Math.max(25, Math.min(75, pct)));
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <div className="h-dvh flex flex-col bg-[var(--color-surface-50)]">
            <EditorToolbar
                projectId={project.id}
                projectName={project.name}
                compiling={compiling}
                saving={saving}
                saveStatus={saveStatus}
                hasCompiledPdf={!!pdfUrl}
                pdfUrl={pdfUrl}
                errorCount={errors.filter((e) => e.severity === "error").length}
                onCompile={handleCompile}
                onSave={handleSave}
                onToggleHistory={() => setShowHistory((prev) => !prev)}
                onToggleAI={() => {
                    setShowAI((prev) => !prev);
                    if (errors.length > 0) setAiMode("fix");
                }}
                offlineDraft={offlineDraft}
                connected={connected}
                peers={peers}
                githubConnected={githubConnected}
                githubRepoUrl={githubRepoUrl}
                getContent={getContent}
            />

            <div className="flex-1 flex min-h-0 relative">
                {/* Monaco Editor */}
                <div
                    className="flex flex-col min-w-0"
                    style={{ width: showPdf ? `${dividerPos}%` : "100%" }}
                >
                    <div className="h-9 flex items-center px-3 gap-4 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-100)] text-xs shrink-0">
                        <div className="flex items-center gap-1.5 text-[var(--color-accent-400)]">
                            <FileIcon />
                            <span className="font-medium">main.tex</span>
                        </div>
                        <button
                            onClick={() => setShowPdf((prev) => !prev)}
                            className="ml-auto text-[var(--color-surface-500)] hover:text-[var(--color-surface-900)] transition-colors"
                        >
                            {showPdf ? "Hide Preview" : "Show Preview"}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0">
                        <Editor
                            language={LATEX_LANGUAGE_ID}
                            defaultValue=""
                            onMount={handleEditorMount}
                            theme="latexforge-dark"
                            options={{
                                fontSize: 14,
                                fontFamily:
                                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                fontLigatures: true,
                                lineNumbers: "on",
                                minimap: { enabled: true, scale: 1 },
                                wordWrap: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                renderWhitespace: "selection",
                                smoothScrolling: true,
                                cursorSmoothCaretAnimation: "on",
                                bracketPairColorization: { enabled: true },
                                padding: { top: 12 },
                            }}
                            loading={
                                <div className="flex items-center justify-center h-full gap-2 text-[var(--color-surface-500)]">
                                    <Spinner />
                                    <span className="text-sm">Loading editor…</span>
                                </div>
                            }
                        />
                    </div>

                    {/* Error panel */}
                    {errors.length > 0 && (
                        <div className="max-h-36 overflow-y-auto border-t border-[var(--color-glass-border)] bg-[var(--color-surface-100)]">
                            <div className="px-3 py-1.5 text-xs font-medium text-[var(--color-surface-500)] border-b border-[var(--color-glass-border)]">
                                Problems ({errors.length})
                            </div>
                            {errors.map((err, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        editorRef.current?.revealLineInCenter(err.line);
                                        editorRef.current?.setPosition({
                                            lineNumber: err.line,
                                            column: err.column,
                                        });
                                        editorRef.current?.focus();
                                    }}
                                    className="w-full flex items-start gap-2 px-3 py-1.5 text-xs hover:bg-[var(--color-glass-hover)] transition-colors text-left"
                                >
                                    {err.severity === "error" ? (
                                        <span className="mt-0.5 w-3.5 h-3.5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        </span>
                                    ) : err.severity === "warning" ? (
                                        <span className="mt-0.5 w-3.5 h-3.5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        </span>
                                    ) : (
                                        <span className="mt-0.5 w-3.5 h-3.5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        </span>
                                    )}
                                    <span className="text-[var(--color-surface-600)]">
                                        <span className="text-[var(--color-surface-400)]">
                                            Ln {err.line}:
                                        </span>{" "}
                                        {err.message}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Resizable divider */}
                {showPdf && (
                    <div
                        onMouseDown={handleMouseDown}
                        className="w-1.5 cursor-col-resize bg-[var(--color-glass-border)] hover:bg-[var(--color-accent-500)]/50 active:bg-[var(--color-accent-500)] transition-colors shrink-0"
                    />
                )}

                {/* PDF Preview */}
                {showPdf && (
                    <div
                        className="flex flex-col min-w-0"
                        style={{ width: `${100 - dividerPos}%` }}
                    >
                        <div className="h-9 flex items-center px-3 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-100)] text-xs shrink-0">
                            <span className="font-medium text-[var(--color-surface-500)]">
                                PDF Preview
                            </span>
                        </div>
                        <div className="flex-1 min-h-0 bg-[#525659]">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-full border-0"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--color-surface-400)] gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-200)]/10 flex items-center justify-center">
                                        <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            className="opacity-50"
                                        >
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                            <polyline points="10 9 9 9 8 9" />
                                        </svg>
                                    </div>
                                    <p className="text-sm">
                                        Press{" "}
                                        <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-200)]/20 font-mono text-xs">
                                            Ctrl+Enter
                                        </kbd>{" "}
                                        to compile
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* History Panel */}
                <HistoryPanel
                    projectId={project.id}
                    open={showHistory}
                    onClose={() => setShowHistory(false)}
                    onRestore={(content) => {
                        const yText = getYText();
                        if (yText) {
                            const doc = getDoc();
                            doc?.transact(() => {
                                yText.delete(0, yText.length);
                                yText.insert(0, content);
                            });
                        }
                        setShowHistory(false);
                    }}
                    githubRepoUrl={githubRepoUrl}
                />

                {/* AI Sidebar */}
                <AISidebar
                    open={showAI}
                    mode={aiMode}
                    errors={errors}
                    getContent={getContent}
                    onApplyContent={(content) => {
                        const yText = getYText();
                        if (yText) {
                            const doc = getDoc();
                            doc?.transact(() => {
                                yText.delete(0, yText.length);
                                yText.insert(0, content);
                            });
                        }
                    }}
                    onClose={() => setShowAI(false)}
                    onModeChange={setAiMode}
                />
            </div>
        </div>
    );
}

// Small inline icons
function FileIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

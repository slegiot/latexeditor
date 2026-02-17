"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor, MarkerSeverity } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { EditorToolbar } from "./EditorToolbar";
import { HistoryPanel } from "./HistoryPanel";
import { AISidebar } from "./AISidebar";
import { FileManager } from "./FileManager";
import { StatusBar } from "./StatusBar";
import { ToastContainer, useToasts } from "./Toast";
import { EditorSettings } from "./EditorSettings";
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
    const [showFiles, setShowFiles] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [aiMode, setAiMode] = useState<"fix" | "generate">("fix");

    // Toast notifications
    const { toasts, addToast, dismissToast } = useToasts();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            // Ctrl/Cmd + \ : Toggle sidebar (files)
            if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
                e.preventDefault();
                setShowFiles((prev) => !prev);
                setShowAI(false);
            }

            // Ctrl/Cmd + Shift + P : Toggle PDF preview
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
                e.preventDefault();
                setShowPdf((prev) => !prev);
            }

            // Ctrl/Cmd + Shift + H : Toggle history
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
                e.preventDefault();
                setShowHistory((prev) => !prev);
            }

            // Escape : Close any open panel
            if (e.key === "Escape") {
                setShowAI(false);
                setShowFiles(false);
                setShowHistory(false);
                setShowSettings(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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

        // Custom themes
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

        // Light theme
        monaco.editor.defineTheme("latexforge-light", {
            base: "vs",
            inherit: true,
            rules: [
                { token: "comment", foreground: "6A9955", fontStyle: "italic" },
                { token: "keyword", foreground: "059669" },
                { token: "keyword.command", foreground: "2563EB" },
                {
                    token: "keyword.section",
                    foreground: "7C3AED",
                    fontStyle: "bold",
                },
                { token: "keyword.formatting", foreground: "D97706" },
                { token: "keyword.math", foreground: "DC2626" },
                { token: "keyword.math-command", foreground: "B45309" },
                { token: "keyword.escape", foreground: "374151" },
                { token: "string.math", foreground: "DC2626" },
                { token: "delimiter.curly", foreground: "CA8A04" },
                { token: "delimiter.bracket", foreground: "7C3AED" },
                { token: "number", foreground: "059669" },
            ],
            colors: {
                "editor.background": "#ffffff",
                "editor.foreground": "#1f2937",
                "editor.lineHighlightBackground": "#f3f4f6",
                "editorCursor.foreground": "#10B981",
                "editor.selectionBackground": "#10B98122",
                "editorLineNumber.foreground": "#9ca3af",
                "editorLineNumber.activeForeground": "#6b7280",
            },
        });

        // Set theme based on current mode
        const isLight = document.documentElement.classList.contains("light");
        monaco.editor.setTheme(isLight ? "latexforge-light" : "latexforge-dark");

        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    const light = document.documentElement.classList.contains("light");
                    monaco.editor.setTheme(light ? "latexforge-light" : "latexforge-dark");
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        // ── Yjs ↔ Monaco binding ──
        const yText = getYText();
        const awareness = getAwareness();
        const model = editor.getModel();

        if (yText && model) {
            // Pre-populate Yjs doc with initial content if it's empty
            // This ensures content is available even when WS server is unreachable
            if (yText.length === 0 && initialContent) {
                const doc = getDoc();
                doc?.transact(() => {
                    yText.insert(0, initialContent);
                });
            }

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
    const compilingToastIdRef = useRef<string | null>(null);

    const handleCompile = useCallback(async () => {
        if (compiling) return;
        setCompiling(true);
        clearMarkers();

        // Dismiss any previous compiling toast
        if (compilingToastIdRef.current) {
            dismissToast(compilingToastIdRef.current);
        }

        // Show compiling toast and track its ID
        const toastId = addToast({
            type: "compiling",
            title: "Compiling document...",
            message: "Running pdfLaTeX",
        });
        compilingToastIdRef.current = toastId;

        try {
            // Read content from Yjs doc, fall back to Monaco editor model
            let content = getContent();
            if (!content && editorRef.current) {
                content = editorRef.current.getModel()?.getValue() ?? "";
            }

            if (!content) {
                setErrors([{
                    line: 1, column: 1,
                    message: "No content to compile — editor is empty",
                    severity: "error",
                }]);
                return;
            }

            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    projectId: project.id,
                }),
            });

            const data = await res.json();

            if (!res.ok && !data.pdfUrl) {
                setErrors([{
                    line: 1, column: 1,
                    message: data.error || `Compilation request failed (${res.status})`,
                    severity: "error",
                }]);
                return;
            }

            if (data.pdfUrl) {
                setPdfUrl(`${data.pdfUrl}?t=${Date.now()}`);
                setShowPdf(true);
            }

            if (data.errors && data.errors.length > 0) {
                setErrors(data.errors);
                setEditorMarkers(data.errors);

                // Show error toast
                const errorCount = data.errors.filter((e: LatexError) => e.severity === "error").length;
                const warningCount = data.errors.filter((e: LatexError) => e.severity === "warning").length;
                addToast({
                    type: errorCount > 0 ? "error" : "warning",
                    title: errorCount > 0 ? "Compilation failed" : "Compilation completed with warnings",
                    message: `${errorCount} error${errorCount !== 1 ? "s" : ""}, ${warningCount} warning${warningCount !== 1 ? "s" : ""}`,
                    errors: data.errors,
                });
            } else {
                setErrors([]);
                // Show success toast
                addToast({
                    type: "success",
                    title: "Compilation successful",
                    message: "PDF generated successfully",
                });
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
            // Always dismiss the compiling toast
            if (compilingToastIdRef.current) {
                dismissToast(compilingToastIdRef.current);
                compilingToastIdRef.current = null;
            }
            setCompiling(false);
        }
    }, [compiling, project.id, clearMarkers, setEditorMarkers, getContent, addToast, dismissToast]);

    // ── Save to Supabase ──
    const documentIdRef = useRef(documentId);

    const handleSave = useCallback(async () => {
        if (saving) return;
        setSaving(true);
        setSaveStatus("saving");

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            // Read content from Yjs, fall back to Monaco editor model
            let content = getContent();
            if ((!content || content.trim().length === 0) && editorRef.current) {
                content = editorRef.current.getModel()?.getValue() ?? "";
            }

            if (!content || content.trim().length === 0) {
                setSaveStatus("error");
                setSaving(false);
                addToast({
                    type: "warning",
                    title: "Nothing to save",
                    message: "The editor is empty. Write some content first.",
                });
                return;
            }

            if (documentIdRef.current) {
                const { error } = await supabase
                    .from("documents")
                    .update({
                        content,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", documentIdRef.current);
                if (error) throw error;
            } else {
                // No document exists yet — insert and save the new ID
                const { data: newDoc, error } = await supabase.from("documents").insert({
                    project_id: project.id,
                    title: "main.tex",
                    content,
                }).select("id").single();
                if (error) throw error;
                if (newDoc) {
                    documentIdRef.current = newDoc.id;
                }
            }

            await supabase
                .from("projects")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", project.id);

            await deleteDraft(project.id);
            setOfflineDraft(false);
            setSaveStatus("saved");

            addToast({
                type: "success",
                title: "Saved",
                message: "Your document has been saved successfully.",
            });

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
        } catch (err) {
            console.error("Save error:", err);
            setSaveStatus("error");
            addToast({
                type: "error",
                title: "Save failed",
                message: "Could not save your document. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    }, [saving, project.id, getContent, addToast]);

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
        <div>
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
                    setShowFiles(false);
                    if (errors.length > 0) setAiMode("fix");
                }}
                onToggleFiles={() => {
                    setShowFiles((prev) => !prev);
                    setShowAI(false);
                }}
                onToggleSettings={() => setShowSettings((prev) => !prev)}
                offlineDraft={offlineDraft}
                connected={connected}
                peers={peers}
                githubConnected={githubConnected}
                githubRepoUrl={githubRepoUrl}
                getContent={getContent}
            />

            <div>
                {/* Monaco Editor */}
                <div
                    style={{ width: showPdf ? `${dividerPos}%` : "100%" }}
                >
                    <div>
                        <div>
                            <FileIcon />
                            <span>main.tex</span>
                        </div>
                        <button
                            onClick={() => setShowPdf((prev) => !prev)}
                        >
                            {showPdf ? "Hide Preview" : "Show Preview"}
                        </button>
                    </div>

                    <div>
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
                                <div>
                                    <Spinner />
                                    <span>Loading editor…</span>
                                </div>
                            }
                        />
                    </div>

                    {/* Error panel */}
                    {errors.length > 0 && (
                        <div>
                            <div>
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
                                >
                                    [{err.severity}]
                                    <span>
                                        Ln {err.line}: {err.message}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Status Bar */}
                    <StatusBar
                        compiling={compiling}
                        hasCompiledPdf={!!pdfUrl}
                        errorCount={errors.filter((e) => e.severity === "error").length}
                        warningCount={errors.filter((e) => e.severity === "warning").length}
                        editorRef={editorRef}
                        fileName="main.tex"
                    />
                </div>

                {/* Resizable divider */}
                {showPdf && (
                    <div
                        onMouseDown={handleMouseDown}
                        style={{ cursor: 'col-resize', width: '6px' }}
                    />
                )}

                {/* PDF Preview */}
                {showPdf && (
                    <div
                        style={{ width: `${100 - dividerPos}%` }}
                    >
                        <div>
                            <span>
                                PDF Preview
                            </span>
                        </div>
                        <div>
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="PDF Preview"
                                />
                            ) : (
                                <div>
                                    <p>
                                        Press <kbd>Ctrl+Enter</kbd> to compile
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

                {/* File Manager */}
                <FileManager
                    open={showFiles}
                    projectId={project.id}
                    onClose={() => setShowFiles(false)}
                />

                {/* Toast Notifications */}
                <ToastContainer toasts={toasts} onDismiss={dismissToast} />

                {/* Settings Modal */}
                <EditorSettings
                    open={showSettings}
                    onClose={() => setShowSettings(false)}
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
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.25"
            />
            <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                opacity="0.75"
            />
        </svg>
    );
}

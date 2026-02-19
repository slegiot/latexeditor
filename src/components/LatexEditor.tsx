'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — Premium LaTeX Editor Component
// ─────────────────────────────────────────────────────────────
// Full-featured Monaco-based LaTeX editor with:
//   ✦ Custom syntax highlighting (Monarch tokenizer)
//   ✦ Auto-closing brackets + \begin{...}\end{...} pairs
//   ✦ Command Palette with LaTeX snippets (Ctrl+Shift+P)
//   ✦ Yjs real-time collaboration (remote cursors + presence)
//   ✦ Dark/Light theme toggle
//   ✦ Minimap, word wrap, line numbers
// ─────────────────────────────────────────────────────────────

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type * as Monaco from 'monaco-editor';

// ── Types ────────────────────────────────────────────────────

export interface LatexEditorProps {
    /** Initial content (used only if no collaboration provider) */
    initialContent?: string;

    /** Theme preference */
    theme?: 'dark' | 'light';

    /** Font size in px */
    fontSize?: number;

    /** Enable word wrap */
    wordWrap?: boolean;

    /** Enable minimap */
    minimap?: boolean;

    /** Enable line numbers */
    lineNumbers?: boolean;

    /** Collaboration config (when provided, enables real-time sync) */
    collaboration?: {
        projectId: string;
        filePath: string;
        userId: string;
        userName: string;
        token: string;
    };

    /** Called whenever content changes */
    onChange?: (content: string) => void;

    /** Called when editor is ready */
    onReady?: (editor: Monaco.editor.IStandaloneCodeEditor) => void;

    /** Called with connected user list updates */
    onUsersChange?: (users: Array<{ name: string; color: string }>) => void;

    /** CSS class for the container */
    className?: string;
}

// ── Component ────────────────────────────────────────────────

export default function LatexEditor({
    initialContent = '',
    theme = 'dark',
    fontSize = 14,
    wordWrap = true,
    minimap = true,
    lineNumbers = true,
    collaboration,
    onChange,
    onReady,
    onUsersChange,
    className = '',
}: LatexEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);
    const cleanupRef = useRef<(() => void)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectedUsers, setConnectedUsers] = useState<
        Array<{ id: string; name: string; color: string }>
    >([]);

    // ── Dynamic Imports (Monaco must be loaded client-side) ────

    const initEditor = useCallback(async () => {
        if (!containerRef.current) return;

        // Dynamically import Monaco (avoids SSR issues in Next.js)
        const monaco = await import('monaco-editor');

        // Import our LaTeX modules
        const { registerLatexLanguage, LATEX_LANGUAGE_ID } = await import('@/lib/latex-language');
        const { registerLatexThemes, LATEX_THEME_DARK, LATEX_THEME_LIGHT } = await import('@/lib/latex-theme');
        const { registerLatexCompletions, registerEnvironmentAutoClose, registerPaletteActions } = await import('@/lib/latex-snippets');

        monacoRef.current = monaco;

        // Register language & themes (idempotent)
        registerLatexLanguage(monaco);
        registerLatexThemes(monaco);

        // Select theme
        const themeName = theme === 'dark' ? LATEX_THEME_DARK : LATEX_THEME_LIGHT;

        // ── Create Editor Instance ───────────────────────────────
        const editor = monaco.editor.create(containerRef.current, {
            value: initialContent,
            language: LATEX_LANGUAGE_ID,
            theme: themeName,

            // ── Typography ─────────────────────────────────────────
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            lineHeight: 1.6,
            letterSpacing: 0.3,

            // ── Layout ─────────────────────────────────────────────
            wordWrap: wordWrap ? 'on' : 'off',
            lineNumbers: lineNumbers ? 'on' : 'off',
            minimap: { enabled: minimap, scale: 2, showSlider: 'mouseover' },
            padding: { top: 16, bottom: 16 },
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false,
                vertical: 'auto',
                horizontal: 'auto',
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            glyphMargin: false,
            folding: true,
            foldingStrategy: 'indentation',

            // ── Editing Behavior ───────────────────────────────────
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined',
            autoIndent: 'full',
            formatOnPaste: false,
            formatOnType: false,
            tabSize: 2,
            insertSpaces: true,
            bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
            guides: {
                bracketPairs: true,
                indentation: true,
                highlightActiveBracketPair: true,
                highlightActiveIndentation: true,
            },

            // ── Suggestions ────────────────────────────────────────
            suggestOnTriggerCharacters: true,
            snippetSuggestions: 'top',
            suggest: {
                showSnippets: true,
                showWords: true,
                snippetsPreventQuickSuggestions: false,
            },
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
            },

            // ── Visual ─────────────────────────────────────────────
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            roundedSelection: true,
            links: true,

            // ── Accessibility ──────────────────────────────────────
            accessibilitySupport: 'auto',
        });

        editorRef.current = editor;

        // ── Register Snippets & Completions ──────────────────────
        const completionDisposable = registerLatexCompletions(monaco);
        cleanupRef.current.push(() => completionDisposable.dispose());

        const envAutoCloseDisposable = registerEnvironmentAutoClose(editor, monaco);
        cleanupRef.current.push(() => envAutoCloseDisposable.dispose());

        const paletteDisposables = registerPaletteActions(editor, monaco);
        cleanupRef.current.push(() => paletteDisposables.forEach((d) => d.dispose()));

        // ── Content Change Handler ───────────────────────────────
        if (onChange) {
            const changeDisposable = editor.onDidChangeModelContent(() => {
                const content = editor.getModel()?.getValue() || '';
                onChange(content);
            });
            cleanupRef.current.push(() => changeDisposable.dispose());
        }

        // ── Collaboration Integration ────────────────────────────
        if (collaboration) {
            try {
                const { createCollaboration } = await import('@/lib/collaboration');
                const { bindYjsToMonaco } = await import('@/lib/yjs-monaco');

                const collab = createCollaboration({
                    projectId: collaboration.projectId,
                    filePath: collaboration.filePath,
                    userId: collaboration.userId,
                    userName: collaboration.userName,
                    token: collaboration.token,
                    onSynced() {
                        console.log('[Editor] Collaboration synced');
                    },
                    onAwarenessUpdate(states) {
                        const users: Array<{ id: string; name: string; color: string }> = [];
                        states.forEach((state) => {
                            if (state.user && state.user.id !== collaboration.userId) {
                                users.push({
                                    id: state.user.id,
                                    name: state.user.name,
                                    color: state.user.color,
                                });
                            }
                        });
                        setConnectedUsers(users);
                        onUsersChange?.(users);
                    },
                });

                // Bind Yjs document to Monaco model
                const unbind = bindYjsToMonaco(collab, editor, monaco);

                cleanupRef.current.push(unbind);
                cleanupRef.current.push(() => collab.destroy());
            } catch (err) {
                console.error('[Editor] Failed to initialize collaboration:', err);
            }
        }

        // ── Ready ────────────────────────────────────────────────
        setIsLoading(false);
        onReady?.(editor);

        // ── Resize Observer ──────────────────────────────────────
        const resizeObserver = new ResizeObserver(() => {
            editor.layout();
        });
        resizeObserver.observe(containerRef.current);
        cleanupRef.current.push(() => resizeObserver.disconnect());
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Mount / Unmount ────────────────────────────────────────
    useEffect(() => {
        initEditor();

        return () => {
            for (const cleanup of cleanupRef.current) {
                try { cleanup(); } catch { /* best-effort */ }
            }
            cleanupRef.current = [];
            editorRef.current?.dispose();
            editorRef.current = null;
        };
    }, [initEditor]);

    // ── Theme updates ──────────────────────────────────────────
    useEffect(() => {
        if (!monacoRef.current) return;
        import('@/lib/latex-theme').then(({ LATEX_THEME_DARK, LATEX_THEME_LIGHT }) => {
            monacoRef.current?.editor.setTheme(
                theme === 'dark' ? LATEX_THEME_DARK : LATEX_THEME_LIGHT
            );
        });
    }, [theme]);

    // ── Font size updates ──────────────────────────────────────
    useEffect(() => {
        editorRef.current?.updateOptions({ fontSize });
    }, [fontSize]);

    // ── Connected users for rendering ──────────────────────────
    const userAvatars = useMemo(() => connectedUsers.slice(0, 8), [connectedUsers]);

    // ── Dynamic styles ───────────────────────────────────────
    const cssVars = useMemo(() => {
        const isDark = theme === 'dark';
        return `
.latex-editor-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: ${isDark ? '#1E1E2E' : '#FAFAFA'};
  box-shadow: 0 4px 24px rgba(0, 0, 0, ${isDark ? '0.4' : '0.1'});
}
.latex-editor-presence {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: ${isDark ? '#181825' : '#F0F0F0'};
  border-bottom: 1px solid ${isDark ? '#313244' : '#E0E0E0'};
}
.presence-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  border: 2px solid ${isDark ? '#1E1E2E' : '#FAFAFA'};
  transition: transform 0.2s ease;
  cursor: default;
}
.presence-avatar:hover {
  transform: scale(1.15);
  z-index: 2;
}
.presence-avatar + .presence-avatar {
  margin-left: -8px;
}
.presence-overflow {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: ${isDark ? '#CDD6F4' : '#383A42'};
  background: ${isDark ? '#45475A' : '#D0D0D0'};
  margin-left: -8px;
}
.latex-editor-monaco {
  flex: 1;
  min-height: 0;
  transition: opacity 0.3s ease;
}
.latex-editor-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${isDark ? '#585B70' : '#9D9D9F'};
  font-size: 14px;
  z-index: 10;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid ${isDark ? '#313244' : '#E0E0E0'};
  border-top-color: ${isDark ? '#89B4FA' : '#4078F2'};
  border-radius: 50%;
  animation: latex-editor-spin 0.8s linear infinite;
}
@keyframes latex-editor-spin {
  to { transform: rotate(360deg); }
}`;
    }, [theme]);

    return (
        <div className={`latex-editor-container ${className}`}>
            <style dangerouslySetInnerHTML={{ __html: cssVars }} />

            {/* ── Toolbar: connected users ───────────────── */}
            {collaboration && userAvatars.length > 0 && (
                <div className="latex-editor-presence">
                    {userAvatars.map((user) => (
                        <div
                            key={user.id}
                            className="presence-avatar"
                            style={{ backgroundColor: user.color }}
                            title={user.name}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {connectedUsers.length > 8 && (
                        <div className="presence-overflow">
                            +{connectedUsers.length - 8}
                        </div>
                    )}
                </div>
            )}

            {/* ── Loading State ──────────────────────────── */}
            {isLoading && (
                <div className="latex-editor-loading">
                    <div className="loading-spinner" />
                    <span>Loading editor...</span>
                </div>
            )}

            {/* ── Monaco Container ───────────────────────── */}
            <div
                ref={containerRef}
                className="latex-editor-monaco"
                style={{ opacity: isLoading ? 0 : 1 }}
            />
        </div>
    );
}


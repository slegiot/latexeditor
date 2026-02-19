'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — Split-Pane Editor Layout
// ─────────────────────────────────────────────────────────────
// Orchestrates the LaTeX editor (left) and PDF viewer (right)
// with:
//   ✦ Resizable split pane via drag handle
//   ✦ Forward sync: editor scroll → PDF page jump
//   ✦ Inverse sync: PDF click → editor line jump
//   ✦ Compilation status bar
//   ✦ SyncTeX integration for line ↔ page mapping
// ─────────────────────────────────────────────────────────────

import React, {
    useRef,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import type * as Monaco from 'monaco-editor';
import LatexEditor from './LatexEditor';
import PdfViewer, { type PdfViewerHandle } from './PdfViewer';
import {
    type SyncTexData,
    type ForwardSyncResult,
    parseSyncTex,
    sourceToPage,
    pageToSource,
    buildLineToPageMap,
} from '@/lib/synctex';

// ── Types ────────────────────────────────────────────────────

export interface EditorLayoutProps {
    /** Project ID for collaboration and compilation */
    projectId: string;

    /** Current file being edited */
    filePath: string;

    /** Initial file content */
    initialContent?: string;

    /** Collaboration config */
    collaboration?: {
        userId: string;
        userName: string;
        token: string;
    };

    /** URL of the compiled PDF (null if not yet compiled) */
    pdfUrl: string | null;

    /** Raw SyncTeX data string (decompressed .synctex content) */
    syncTexRaw?: string | null;

    /** Theme */
    theme?: 'dark' | 'light';

    /** Called when content changes */
    onChange?: (content: string) => void;

    /** Called when user triggers compilation */
    onCompile?: () => void;

    /** Compilation status message */
    compileStatus?: 'idle' | 'compiling' | 'success' | 'error';

    /** CSS class */
    className?: string;
}

// ── Default split ratio ──────────────────────────────────────
const DEFAULT_SPLIT = 0.55; // 55% editor, 45% PDF
const MIN_PANEL_PX = 200;

// ── Component ────────────────────────────────────────────────

export default function EditorLayout({
    projectId,
    filePath,
    initialContent = '',
    collaboration,
    pdfUrl,
    syncTexRaw,
    theme = 'dark',
    onChange,
    onCompile,
    compileStatus = 'idle',
    className = '',
}: EditorLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const pdfViewerRef = useRef<PdfViewerHandle>(null);

    const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT);
    const [isDragging, setIsDragging] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(true);
    const [connectedUsers, setConnectedUsers] = useState<
        Array<{ name: string; color: string }>
    >([]);

    // Debounce ref for forward sync
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Parse SyncTeX Data ────────────────────────────────────
    const syncTexData: SyncTexData | null = useMemo(() => {
        if (!syncTexRaw) return null;
        try {
            return parseSyncTex(syncTexRaw);
        } catch (err) {
            console.error('[EditorLayout] SyncTeX parse error:', err);
            return null;
        }
    }, [syncTexRaw]);

    // ── Line → Page Map (for efficient scroll sync) ──────────
    const lineToPage = useMemo(() => {
        if (!syncTexData) return new Map<number, number>();
        return buildLineToPageMap(syncTexData, filePath);
    }, [syncTexData, filePath]);

    // ── Resizable Split Pane ──────────────────────────────────
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        function handleMouseMove(e: MouseEvent) {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const ratio = x / rect.width;

            // Clamp to minimum panel sizes
            const minRatio = MIN_PANEL_PX / rect.width;
            const maxRatio = 1 - minRatio;
            setSplitRatio(Math.max(minRatio, Math.min(maxRatio, ratio)));
        }

        function handleMouseUp() {
            setIsDragging(false);
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // ── Forward Sync: Editor Scroll → PDF ─────────────────────
    const handleEditorReady = useCallback(
        (editor: Monaco.editor.IStandaloneCodeEditor) => {
            editorInstanceRef.current = editor;

            // Listen for cursor/scroll changes
            editor.onDidChangeCursorPosition((e) => {
                if (!syncEnabled || !syncTexData) return;

                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = setTimeout(() => {
                    const line = e.position.lineNumber;
                    const result: ForwardSyncResult | null = sourceToPage(
                        syncTexData,
                        filePath,
                        line
                    );

                    if (result && pdfViewerRef.current) {
                        pdfViewerRef.current.scrollToPosition(result.page, result.yNorm);
                    }
                }, 150); // 150ms debounce
            });

            // Also sync on scroll (using visible range)
            editor.onDidScrollChange(() => {
                if (!syncEnabled || !syncTexData || !lineToPage.size) return;

                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = setTimeout(() => {
                    const visibleRange = editor.getVisibleRanges()[0];
                    if (!visibleRange) return;

                    // Use the line at ~30% of visible range
                    const midLine = Math.floor(
                        visibleRange.startLineNumber +
                        (visibleRange.endLineNumber - visibleRange.startLineNumber) * 0.3
                    );

                    const page = lineToPage.get(midLine);
                    if (page && pdfViewerRef.current) {
                        // Estimate vertical position
                        const result = sourceToPage(syncTexData, filePath, midLine);
                        if (result) {
                            pdfViewerRef.current.scrollToPosition(result.page, result.yNorm);
                        }
                    }
                }, 200);
            });
        },
        [syncEnabled, syncTexData, filePath, lineToPage]
    );

    // ── Inverse Sync: PDF Click → Editor Line ────────────────
    const handlePdfClick = useCallback(
        (page: number, x: number, y: number) => {
            if (!syncEnabled || !syncTexData || !editorInstanceRef.current) return;

            const result = pageToSource(syncTexData, page, x, y);
            if (!result) return;

            // Only jump if the click corresponds to the current file
            const currentBasename = filePath.split('/').pop();
            const resultBasename = result.file.split('/').pop();
            if (currentBasename !== resultBasename) return;

            const editor = editorInstanceRef.current;
            editor.revealLineInCenter(result.line);
            editor.setPosition({
                lineNumber: result.line,
                column: result.column || 1,
            });
            editor.focus();
        },
        [syncEnabled, syncTexData, filePath]
    );

    // ── Keyboard Shortcut: Ctrl+Enter to compile ──────────────
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onCompile?.();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCompile]);

    // ── Collaboration Props ───────────────────────────────────
    const collabProps = collaboration ? {
        projectId,
        filePath,
        userId: collaboration.userId,
        userName: collaboration.userName,
        token: collaboration.token,
    } : undefined;

    const isDark = theme === 'dark';

    // ── Compile status colors ─────────────────────────────────
    const statusConfig = {
        idle: { label: 'Ready', color: isDark ? '#585B70' : '#9D9D9F' },
        compiling: { label: 'Compiling…', color: '#F9E2AF' },
        success: { label: 'Compiled', color: '#A6E3A1' },
        error: { label: 'Error', color: '#F38BA8' },
    };

    const status = statusConfig[compileStatus];

    return (
        <div
            ref={containerRef}
            className={`editor-layout ${className}`}
            style={{ cursor: isDragging ? 'col-resize' : undefined }}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
.editor-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: ${isDark ? '#11111B' : '#E8E8E8'};
  overflow: hidden;
}
.editor-layout-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${isDark ? '#1E1E2E' : '#FAFAFA'};
  border-bottom: 1px solid ${isDark ? '#313244' : '#E0E0E0'};
  font-size: 13px;
  color: ${isDark ? '#CDD6F4' : '#383A42'};
  flex-shrink: 0;
  z-index: 10;
}
.editor-layout-toolbar button {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid ${isDark ? '#45475A' : '#D0D0D0'};
  background: ${isDark ? '#313244' : '#E8E8E8'};
  color: ${isDark ? '#CDD6F4' : '#383A42'};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.editor-layout-toolbar button:hover {
  background: ${isDark ? '#45475A' : '#D0D0D0'};
}
.compile-btn {
  background: ${isDark ? '#89B4FA' : '#4078F2'} !important;
  color: ${isDark ? '#1E1E2E' : '#FFFFFF'} !important;
  border-color: transparent !important;
  font-weight: 600 !important;
}
.compile-btn:hover {
  opacity: 0.9;
}
.compile-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sync-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}
.sync-toggle input {
  accent-color: ${isDark ? '#89B4FA' : '#4078F2'};
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.toolbar-spacer {
  flex: 1;
}
.toolbar-sep {
  width: 1px;
  height: 20px;
  background: ${isDark ? '#45475A' : '#D0D0D0'};
}
.editor-layout-split {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}
.split-panel-editor {
  overflow: hidden;
}
.split-panel-pdf {
  overflow: hidden;
}
.split-handle {
  width: 6px;
  cursor: col-resize;
  background: ${isDark ? '#313244' : '#D0D0D0'};
  transition: background 0.15s ease;
  position: relative;
  flex-shrink: 0;
  z-index: 5;
}
.split-handle:hover,
.split-handle.active {
  background: ${isDark ? '#89B4FA' : '#4078F2'};
}
.split-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 40px;
  background: ${isDark ? '#585B70' : '#9D9D9F'};
  border-radius: 1px;
  opacity: 0.5;
}
.split-handle:hover::after {
  opacity: 0;
}
      `}} />

            {/* ── Toolbar ──────────────────────────────────── */}
            <div className="editor-layout-toolbar">
                <button
                    className="compile-btn"
                    onClick={onCompile}
                    disabled={compileStatus === 'compiling'}
                    title="Ctrl+Enter"
                >
                    {compileStatus === 'compiling' ? '⏳ Compiling…' : '▶ Compile'}
                </button>
                <span className="status-dot" style={{ backgroundColor: status.color }} />
                <span style={{ opacity: 0.7, fontSize: 12 }}>{status.label}</span>

                <div className="toolbar-spacer" />

                <label className="sync-toggle">
                    <input
                        type="checkbox"
                        checked={syncEnabled}
                        onChange={(e) => setSyncEnabled(e.target.checked)}
                    />
                    Sync-Scroll
                </label>

                <div className="toolbar-sep" />

                <span style={{ opacity: 0.5, fontSize: 11 }}>
                    {filePath}
                </span>
            </div>

            {/* ── Split Pane ──────────────────────────────── */}
            <div className="editor-layout-split">
                {/* Left: Editor */}
                <div
                    className="split-panel-editor"
                    style={{ width: `${splitRatio * 100}%` }}
                >
                    <LatexEditor
                        initialContent={initialContent}
                        theme={theme}
                        collaboration={collabProps}
                        onChange={onChange}
                        onReady={handleEditorReady}
                        onUsersChange={setConnectedUsers}
                    />
                </div>

                {/* Drag Handle */}
                <div
                    className={`split-handle ${isDragging ? 'active' : ''}`}
                    onMouseDown={handleMouseDown}
                />

                {/* Right: PDF Viewer */}
                <div
                    className="split-panel-pdf"
                    style={{ width: `${(1 - splitRatio) * 100}%` }}
                >
                    <PdfViewer
                        ref={pdfViewerRef}
                        pdfUrl={pdfUrl}
                        theme={theme}
                        onPdfClick={handlePdfClick}
                    />
                </div>
            </div>
        </div>
    );
}

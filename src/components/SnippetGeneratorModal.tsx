'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — Snippet Generator Modal
// ─────────────────────────────────────────────────────────────
// Modal dialog for generating complex LaTeX elements:
//   ✦ Natural language input (e.g. "Draw a neural network")
//   ✦ Optional CSV paste area for tables
//   ✦ Type selector (auto/tikz/table/matrix/algorithm/plot)
//   ✦ Generated code with syntax highlighting
//   ✦ Live PDF preview
//   ✦ "Insert into Document" button
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────

type SnippetType = 'auto' | 'tikz' | 'table' | 'matrix' | 'algorithm' | 'plot' | 'diagram';

interface GenerateResult {
    code: string;
    requiredPackages: string[];
    type: SnippetType;
    previewDocument: string;
}

interface SnippetGeneratorModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Close the modal */
    onClose: () => void;
    /** Called when user clicks "Insert" — provides the LaTeX code */
    onInsert: (code: string, requiredPackages: string[]) => void;
    /** Packages already loaded in the document preamble */
    existingPackages?: string[];
}

// ── Type Icons & Labels ──────────────────────────────────────

const TYPE_OPTIONS: { value: SnippetType; label: string; icon: string }[] = [
    { value: 'auto', label: 'Auto-detect', icon: '✨' },
    { value: 'tikz', label: 'TikZ Diagram', icon: '🎨' },
    { value: 'table', label: 'Table', icon: '📊' },
    { value: 'matrix', label: 'Math/Matrix', icon: '🔢' },
    { value: 'algorithm', label: 'Algorithm', icon: '⚙️' },
    { value: 'plot', label: 'Plot/Chart', icon: '📈' },
    { value: 'diagram', label: 'Other Diagram', icon: '📐' },
];

// ── Example Prompts ──────────────────────────────────────────

const EXAMPLES: { type: SnippetType; prompt: string }[] = [
    { type: 'tikz', prompt: 'Draw a neural network with 3 hidden layers, 4 nodes each' },
    { type: 'tikz', prompt: 'Create a flowchart for a login authentication process' },
    { type: 'table', prompt: 'Create a comparison table of sorting algorithms with complexity' },
    { type: 'matrix', prompt: 'Write a 3x3 augmented matrix for a linear system' },
    { type: 'algorithm', prompt: 'Write pseudocode for binary search' },
    { type: 'plot', prompt: 'Plot sin(x) and cos(x) from 0 to 2π on the same axes' },
];

// ── Component ────────────────────────────────────────────────

export default function SnippetGeneratorModal({
    isOpen,
    onClose,
    onInsert,
    existingPackages = [],
}: SnippetGeneratorModalProps) {
    const [prompt, setPrompt] = useState('');
    const [snippetType, setSnippetType] = useState<SnippetType>('auto');
    const [csvData, setCsvData] = useState('');
    const [showCsvInput, setShowCsvInput] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [result, setResult] = useState<GenerateResult | null>(null);
    const [editedCode, setEditedCode] = useState('');
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const codeRef = useRef<HTMLTextAreaElement>(null);

    // Focus on open
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setPrompt('');
            setSnippetType('auto');
            setCsvData('');
            setShowCsvInput(false);
            setResult(null);
            setEditedCode('');
            setPreviewPdf(null);
            setError(null);
            setPreviewError(null);
        }
    }, [isOpen]);

    // ── Generate ─────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setResult(null);
        setPreviewPdf(null);
        setPreviewError(null);

        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    type: snippetType,
                    csvData: showCsvInput ? csvData : undefined,
                    existingPackages,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Generation failed' }));
                setError(errData.error || 'Failed to generate snippet');
                return;
            }

            const data: GenerateResult = await res.json();
            setResult(data);
            setEditedCode(data.code);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, snippetType, csvData, showCsvInput, existingPackages]);

    // ── Preview ──────────────────────────────────────────────
    const handlePreview = useCallback(async () => {
        if (!result) return;

        setIsPreviewing(true);
        setPreviewError(null);

        try {
            // Build a preview document with the (possibly edited) code
            const previewDoc = buildClientPreviewDoc(editedCode, result.requiredPackages);

            const res = await fetch('/api/ai/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document: previewDoc }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setPreviewError(data.detail || data.error || 'Preview compilation failed');
                return;
            }

            setPreviewPdf(data.pdfBase64);
        } catch (err) {
            setPreviewError(err instanceof Error ? err.message : 'Preview failed');
        } finally {
            setIsPreviewing(false);
        }
    }, [result, editedCode]);

    // ── Insert ───────────────────────────────────────────────
    const handleInsert = useCallback(() => {
        if (!result) return;
        onInsert(editedCode || result.code, result.requiredPackages);
        onClose();
    }, [result, editedCode, onInsert, onClose]);

    // ── Example click ────────────────────────────────────────
    const handleExample = useCallback((example: typeof EXAMPLES[0]) => {
        setPrompt(example.prompt);
        setSnippetType(example.type);
    }, []);

    // ── Keyboard shortcuts ───────────────────────────────────
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isGenerating) {
            handleGenerate();
        }
    }, [onClose, handleGenerate, isGenerating]);

    if (!isOpen) return null;

    return (
        <div
            className="snippet-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={handleKeyDown}
        >
            <div className="snippet-modal" role="dialog" aria-label="LaTeX Snippet Generator">
                {/* ── Header ──────────────────────────────────── */}
                <div className="snippet-modal-header">
                    <div className="snippet-modal-title">
                        <span className="snippet-modal-icon">⚡</span>
                        <h2>Generate LaTeX Element</h2>
                    </div>
                    <button
                        className="snippet-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="snippet-modal-body">
                    {/* ── Left Panel: Input ────────────────────── */}
                    <div className="snippet-input-panel">
                        {/* Type Selector */}
                        <div className="snippet-type-selector">
                            {TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`snippet-type-btn ${snippetType === opt.value ? 'active' : ''}`}
                                    onClick={() => setSnippetType(opt.value)}
                                >
                                    <span className="snippet-type-icon">{opt.icon}</span>
                                    <span className="snippet-type-label">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Prompt Input */}
                        <div className="snippet-prompt-area">
                            <label htmlFor="snippet-prompt">Describe what you want to generate</label>
                            <textarea
                                id="snippet-prompt"
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Draw a neural network with 3 hidden layers and 4 nodes each..."
                                rows={4}
                                className="snippet-textarea"
                            />
                            <div className="snippet-prompt-hint">
                                Press <kbd>⌘</kbd>+<kbd>↵</kbd> to generate
                            </div>
                        </div>

                        {/* CSV Toggle */}
                        {(snippetType === 'table' || snippetType === 'auto') && (
                            <div className="snippet-csv-section">
                                <button
                                    className="snippet-csv-toggle"
                                    onClick={() => setShowCsvInput(!showCsvInput)}
                                >
                                    {showCsvInput ? '▾ Hide CSV Data' : '▸ Paste CSV Data (optional)'}
                                </button>
                                {showCsvInput && (
                                    <textarea
                                        value={csvData}
                                        onChange={(e) => setCsvData(e.target.value)}
                                        placeholder="Name,Value,Unit\nSpeed,340,m/s\nDistance,150,km"
                                        rows={5}
                                        className="snippet-textarea snippet-csv"
                                    />
                                )}
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            className="snippet-generate-btn"
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="snippet-spinner" />
                                    Generating...
                                </>
                            ) : (
                                '⚡ Generate'
                            )}
                        </button>

                        {/* Examples */}
                        {!result && (
                            <div className="snippet-examples">
                                <h4>Try an example:</h4>
                                <div className="snippet-example-list">
                                    {EXAMPLES.map((ex, i) => (
                                        <button
                                            key={i}
                                            className="snippet-example-btn"
                                            onClick={() => handleExample(ex)}
                                        >
                                            {ex.prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="snippet-error">
                                <span>⚠</span> {error}
                            </div>
                        )}
                    </div>

                    {/* ── Right Panel: Result ──────────────────── */}
                    {result && (
                        <div className="snippet-result-panel">
                            {/* Packages Info */}
                            {result.requiredPackages.length > 0 && (
                                <div className="snippet-packages">
                                    <span className="snippet-package-label">Required packages:</span>
                                    {result.requiredPackages.map((pkg) => (
                                        <span key={pkg} className="snippet-package-tag">
                                            {pkg}
                                            {existingPackages.includes(pkg) && (
                                                <span className="snippet-package-check" title="Already loaded"> ✓</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Editable Code */}
                            <div className="snippet-code-area">
                                <label htmlFor="snippet-code">Generated LaTeX (editable)</label>
                                <textarea
                                    id="snippet-code"
                                    ref={codeRef}
                                    value={editedCode}
                                    onChange={(e) => setEditedCode(e.target.value)}
                                    className="snippet-code-editor"
                                    spellCheck={false}
                                />
                            </div>

                            {/* Preview Area */}
                            <div className="snippet-preview-section">
                                <div className="snippet-preview-controls">
                                    <button
                                        className="snippet-preview-btn"
                                        onClick={handlePreview}
                                        disabled={isPreviewing}
                                    >
                                        {isPreviewing ? (
                                            <>
                                                <span className="snippet-spinner" />
                                                Compiling...
                                            </>
                                        ) : (
                                            '👁 Live Preview'
                                        )}
                                    </button>
                                </div>

                                {previewError && (
                                    <div className="snippet-preview-error">
                                        <span>⚠</span> {previewError}
                                    </div>
                                )}

                                {previewPdf && (
                                    <div className="snippet-preview-frame">
                                        <iframe
                                            src={`data:application/pdf;base64,${previewPdf}`}
                                            title="LaTeX Preview"
                                            className="snippet-preview-iframe"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="snippet-actions">
                                <button
                                    className="snippet-insert-btn"
                                    onClick={handleInsert}
                                >
                                    ✓ Insert into Document
                                </button>
                                <button
                                    className="snippet-copy-btn"
                                    onClick={() => navigator.clipboard.writeText(editedCode)}
                                >
                                    📋 Copy Code
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Styles ──────────────────────────────────── */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .snippet-modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        animation: fadeIn 0.15s ease;
                    }
                    @keyframes fadeIn { from { opacity: 0 } }

                    .snippet-modal {
                        background: #1a1b26;
                        border: 1px solid #2a2d3e;
                        border-radius: 16px;
                        width: 95vw;
                        max-width: 1200px;
                        max-height: 90vh;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
                        animation: slideUp 0.2s ease;
                    }
                    @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } }

                    .snippet-modal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 20px 24px;
                        border-bottom: 1px solid #2a2d3e;
                    }

                    .snippet-modal-title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .snippet-modal-title h2 {
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #e1e2e8;
                    }

                    .snippet-modal-icon {
                        font-size: 22px;
                    }

                    .snippet-modal-close {
                        background: none;
                        border: none;
                        color: #6b7280;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 6px;
                        transition: all 0.15s;
                    }
                    .snippet-modal-close:hover {
                        background: #2a2d3e;
                        color: #e1e2e8;
                    }

                    .snippet-modal-body {
                        display: flex;
                        flex: 1;
                        overflow: hidden;
                        min-height: 500px;
                    }

                    .snippet-input-panel {
                        flex: 0 0 420px;
                        padding: 20px 24px;
                        border-right: 1px solid #2a2d3e;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .snippet-result-panel {
                        flex: 1;
                        padding: 20px 24px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }

                    /* ── Type Selector ──────────────────────── */
                    .snippet-type-selector {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                    }

                    .snippet-type-btn {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        padding: 6px 12px;
                        border: 1px solid #2a2d3e;
                        border-radius: 8px;
                        background: transparent;
                        color: #9ca3af;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }
                    .snippet-type-btn:hover {
                        border-color: #4f46e5;
                        color: #c7d2fe;
                    }
                    .snippet-type-btn.active {
                        background: #4f46e5;
                        border-color: #4f46e5;
                        color: white;
                    }

                    .snippet-type-icon { font-size: 14px; }
                    .snippet-type-label { font-size: 12px; }

                    /* ── Prompt ─────────────────────────────── */
                    .snippet-prompt-area label,
                    .snippet-code-area label {
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: #9ca3af;
                        margin-bottom: 6px;
                    }

                    .snippet-textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #2a2d3e;
                        border-radius: 10px;
                        background: #111218;
                        color: #e1e2e8;
                        font-size: 14px;
                        font-family: inherit;
                        resize: vertical;
                        outline: none;
                        transition: border-color 0.15s;
                    }
                    .snippet-textarea:focus {
                        border-color: #4f46e5;
                    }

                    .snippet-prompt-hint {
                        font-size: 11px;
                        color: #6b7280;
                        margin-top: 4px;
                    }
                    .snippet-prompt-hint kbd {
                        padding: 1px 5px;
                        border: 1px solid #3a3d4e;
                        border-radius: 4px;
                        background: #2a2d3e;
                        font-size: 11px;
                    }

                    /* ── CSV ────────────────────────────────── */
                    .snippet-csv-toggle {
                        background: none;
                        border: none;
                        color: #6366f1;
                        font-size: 13px;
                        cursor: pointer;
                        padding: 0;
                    }
                    .snippet-csv {
                        margin-top: 8px;
                        font-family: 'SF Mono', 'Fira Code', monospace;
                        font-size: 12px;
                    }

                    /* ── Generate Button ───────────────────── */
                    .snippet-generate-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 12px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .snippet-generate-btn:hover:not(:disabled) {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
                    }
                    .snippet-generate-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    /* ── Spinner ────────────────────────────── */
                    .snippet-spinner {
                        width: 16px;
                        height: 16px;
                        border: 2px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 0.6s linear infinite;
                        display: inline-block;
                    }
                    @keyframes spin { to { transform: rotate(360deg) } }

                    /* ── Examples ───────────────────────────── */
                    .snippet-examples h4 {
                        font-size: 12px;
                        font-weight: 500;
                        color: #6b7280;
                        margin: 0 0 8px;
                    }

                    .snippet-example-list {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .snippet-example-btn {
                        background: none;
                        border: 1px solid transparent;
                        border-radius: 8px;
                        color: #9ca3af;
                        font-size: 12px;
                        text-align: left;
                        padding: 8px 10px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }
                    .snippet-example-btn:hover {
                        background: #1e1f2e;
                        border-color: #2a2d3e;
                        color: #c7d2fe;
                    }

                    /* ── Error ──────────────────────────────── */
                    .snippet-error,
                    .snippet-preview-error {
                        padding: 10px 14px;
                        border-radius: 8px;
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        color: #fca5a5;
                        font-size: 13px;
                    }

                    /* ── Packages ───────────────────────────── */
                    .snippet-packages {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 6px;
                    }
                    .snippet-package-label {
                        font-size: 12px;
                        color: #6b7280;
                    }
                    .snippet-package-tag {
                        padding: 3px 8px;
                        border-radius: 6px;
                        background: #1e1f2e;
                        border: 1px solid #2a2d3e;
                        color: #a5b4fc;
                        font-size: 11px;
                        font-family: 'SF Mono', 'Fira Code', monospace;
                    }
                    .snippet-package-check {
                        color: #34d399;
                        font-size: 10px;
                    }

                    /* ── Code Editor ────────────────────────── */
                    .snippet-code-area {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        min-height: 0;
                    }

                    .snippet-code-editor {
                        flex: 1;
                        width: 100%;
                        min-height: 200px;
                        padding: 12px;
                        border: 1px solid #2a2d3e;
                        border-radius: 10px;
                        background: #0d0e14;
                        color: #a5f3a8;
                        font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
                        font-size: 12px;
                        line-height: 1.6;
                        resize: vertical;
                        outline: none;
                        tab-size: 2;
                    }
                    .snippet-code-editor:focus {
                        border-color: #4f46e5;
                    }

                    /* ── Preview ────────────────────────────── */
                    .snippet-preview-section {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .snippet-preview-controls {
                        display: flex;
                        gap: 8px;
                    }

                    .snippet-preview-btn {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 8px 16px;
                        border: 1px solid #2a2d3e;
                        border-radius: 8px;
                        background: #1e1f2e;
                        color: #e1e2e8;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }
                    .snippet-preview-btn:hover:not(:disabled) {
                        border-color: #4f46e5;
                    }
                    .snippet-preview-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .snippet-preview-frame {
                        border: 1px solid #2a2d3e;
                        border-radius: 10px;
                        overflow: hidden;
                        background: white;
                    }

                    .snippet-preview-iframe {
                        width: 100%;
                        height: 250px;
                        border: none;
                    }

                    /* ── Actions ────────────────────────────── */
                    .snippet-actions {
                        display: flex;
                        gap: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #2a2d3e;
                    }

                    .snippet-insert-btn {
                        flex: 1;
                        padding: 12px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #059669, #10b981);
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .snippet-insert-btn:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
                    }

                    .snippet-copy-btn {
                        padding: 12px 20px;
                        border: 1px solid #2a2d3e;
                        border-radius: 10px;
                        background: transparent;
                        color: #9ca3af;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }
                    .snippet-copy-btn:hover {
                        border-color: #4f46e5;
                        color: #e1e2e8;
                    }
                `}} />
            </div>
        </div>
    );
}

// ── Helper ───────────────────────────────────────────────────

function buildClientPreviewDoc(code: string, packages: string[]): string {
    const usepackages = packages
        .map((p) => {
            if (p === 'pgfplots') return '\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}';
            if (p === 'algorithm2e') return '\\usepackage[ruled,vlined]{algorithm2e}';
            return `\\usepackage{${p}}`;
        })
        .join('\n');

    const tikzLibs: string[] = [];
    const cleanCode = code.replace(
        /\\usetikzlibrary\{([^}]+)\}/g,
        (_, libs) => { tikzLibs.push(libs); return ''; }
    );
    const tikzLine = tikzLibs.length > 0
        ? `\\usetikzlibrary{${tikzLibs.join(',')}}`
        : '';

    return `\\documentclass[border=10pt,preview]{standalone}
${usepackages}
${tikzLine}
\\begin{document}
${cleanCode.trim()}
\\end{document}`;
}

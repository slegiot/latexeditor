'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — Math Sandbox Side-Panel
// ─────────────────────────────────────────────────────────────
// Visual equation editor using MathLive. Users can:
//   ✦ Type or click to build equations visually
//   ✦ See the LaTeX code generated in real-time
//   ✦ Use a symbol palette for common constructs
//   ✦ Insert the generated code at cursor in the editor
//   ✦ Keep a history of recent equations
//
// Dependencies: mathlive (npm)
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────

interface MathSandboxProps {
    /** Whether the panel is visible */
    isOpen: boolean;
    /** Close/toggle the panel */
    onClose: () => void;
    /** Insert LaTeX at the editor cursor */
    onInsert: (latex: string, wrapInMath?: boolean) => void;
}

interface HistoryEntry {
    latex: string;
    timestamp: number;
}

type WrapMode = 'inline' | 'display' | 'raw';

// ── Symbol Palette ───────────────────────────────────────────

interface SymbolGroup {
    label: string;
    icon: string;
    symbols: { label: string; latex: string; desc?: string }[];
}

const SYMBOL_PALETTE: SymbolGroup[] = [
    {
        label: 'Greek', icon: 'α',
        symbols: [
            { label: 'α', latex: '\\alpha' },
            { label: 'β', latex: '\\beta' },
            { label: 'γ', latex: '\\gamma' },
            { label: 'δ', latex: '\\delta' },
            { label: 'ε', latex: '\\epsilon' },
            { label: 'θ', latex: '\\theta' },
            { label: 'λ', latex: '\\lambda' },
            { label: 'μ', latex: '\\mu' },
            { label: 'π', latex: '\\pi' },
            { label: 'σ', latex: '\\sigma' },
            { label: 'φ', latex: '\\phi' },
            { label: 'ω', latex: '\\omega' },
            { label: 'Γ', latex: '\\Gamma' },
            { label: 'Δ', latex: '\\Delta' },
            { label: 'Σ', latex: '\\Sigma' },
            { label: 'Ω', latex: '\\Omega' },
        ],
    },
    {
        label: 'Operators', icon: '∑',
        symbols: [
            { label: '∑', latex: '\\sum_{i=0}^{n}', desc: 'Summation' },
            { label: '∏', latex: '\\prod_{i=0}^{n}', desc: 'Product' },
            { label: '∫', latex: '\\int_{a}^{b}', desc: 'Integral' },
            { label: '∬', latex: '\\iint', desc: 'Double integral' },
            { label: '∮', latex: '\\oint', desc: 'Contour integral' },
            { label: 'lim', latex: '\\lim_{x \\to \\infty}', desc: 'Limit' },
            { label: '∂', latex: '\\partial', desc: 'Partial' },
            { label: '∇', latex: '\\nabla', desc: 'Nabla' },
            { label: '∞', latex: '\\infty', desc: 'Infinity' },
        ],
    },
    {
        label: 'Relations', icon: '≤',
        symbols: [
            { label: '≤', latex: '\\leq' },
            { label: '≥', latex: '\\geq' },
            { label: '≠', latex: '\\neq' },
            { label: '≈', latex: '\\approx' },
            { label: '≡', latex: '\\equiv' },
            { label: '∝', latex: '\\propto' },
            { label: '∈', latex: '\\in' },
            { label: '⊂', latex: '\\subset' },
            { label: '∀', latex: '\\forall' },
            { label: '∃', latex: '\\exists' },
            { label: '±', latex: '\\pm' },
            { label: '×', latex: '\\times' },
            { label: '÷', latex: '\\div' },
            { label: '·', latex: '\\cdot' },
        ],
    },
    {
        label: 'Structures', icon: '⌈',
        symbols: [
            { label: 'a/b', latex: '\\frac{a}{b}', desc: 'Fraction' },
            { label: '√', latex: '\\sqrt{x}', desc: 'Square root' },
            { label: 'ⁿ√', latex: '\\sqrt[n]{x}', desc: 'nth root' },
            { label: 'x²', latex: 'x^{2}', desc: 'Superscript' },
            { label: 'xᵢ', latex: 'x_{i}', desc: 'Subscript' },
            { label: 'ā', latex: '\\bar{x}', desc: 'Bar' },
            { label: 'â', latex: '\\hat{x}', desc: 'Hat' },
            { label: '→', latex: '\\vec{x}', desc: 'Vector' },
            { label: 'ẋ', latex: '\\dot{x}', desc: 'Dot' },
            { label: '‖', latex: '\\|x\\|', desc: 'Norm' },
        ],
    },
    {
        label: 'Matrices', icon: '▦',
        symbols: [
            { label: '(…)', latex: '\\begin{pmatrix} a & b \\\\\\ c & d \\end{pmatrix}', desc: 'Parenthesised matrix' },
            { label: '[…]', latex: '\\begin{bmatrix} a & b \\\\\\ c & d \\end{bmatrix}', desc: 'Bracket matrix' },
            { label: '|…|', latex: '\\begin{vmatrix} a & b \\\\\\ c & d \\end{vmatrix}', desc: 'Determinant' },
            { label: '{…', latex: '\\begin{cases} x & \\text{if } x > 0 \\\\\\ -x & \\text{otherwise} \\end{cases}', desc: 'Cases' },
        ],
    },
    {
        label: 'Sets', icon: 'ℝ',
        symbols: [
            { label: 'ℝ', latex: '\\mathbb{R}' },
            { label: 'ℕ', latex: '\\mathbb{N}' },
            { label: 'ℤ', latex: '\\mathbb{Z}' },
            { label: 'ℚ', latex: '\\mathbb{Q}' },
            { label: 'ℂ', latex: '\\mathbb{C}' },
            { label: '∅', latex: '\\emptyset' },
            { label: '∪', latex: '\\cup' },
            { label: '∩', latex: '\\cap' },
        ],
    },
];

// ── Component ────────────────────────────────────────────────

export default function MathSandbox({ isOpen, onClose, onInsert }: MathSandboxProps) {
    const [latex, setLatex] = useState('');
    const [wrapMode, setWrapMode] = useState<WrapMode>('display');
    const [activeGroup, setActiveGroup] = useState(0);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [copied, setCopied] = useState(false);
    const mathfieldRef = useRef<HTMLElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // ── Initialise MathLive ──────────────────────────────────
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        let mf: HTMLElement | null = null;

        const initMathfield = async () => {
            // Dynamic import to avoid SSR issues
            await import('mathlive');

            // Check if already initialised
            const existing = containerRef.current?.querySelector('math-field');
            if (existing) {
                mathfieldRef.current = existing as HTMLElement;
                return;
            }

            // Create the math-field element
            mf = document.createElement('math-field');
            mf.setAttribute('virtual-keyboard-mode', 'manual');
            mf.setAttribute('smart-mode', 'true');
            mf.setAttribute('smart-fence', 'true');
            mf.setAttribute('smart-superscript', 'true');

            // Style it
            mf.style.width = '100%';
            mf.style.minHeight = '80px';
            mf.style.fontSize = '22px';
            mf.style.padding = '16px';
            mf.style.borderRadius = '12px';
            mf.style.border = '1px solid #2a2d3e';
            mf.style.background = '#0d0e14';
            mf.style.color = '#e1e2e8';
            mf.style.outline = 'none';

            // Listen for input changes
            mf.addEventListener('input', () => {
                const value = (mf as unknown as { value: string })?.value || '';
                setLatex(value);
            });

            containerRef.current?.appendChild(mf);
            mathfieldRef.current = mf;

            // Focus
            setTimeout(() => {
                (mf as unknown as { focus: () => void })?.focus?.();
            }, 100);
        };

        initMathfield();

        return () => {
            // Don't remove on toggle — keep state
        };
    }, [isOpen]);

    // ── Insert symbol into math field ────────────────────────
    const insertSymbol = useCallback((symbolLatex: string) => {
        const mf = mathfieldRef.current as unknown as {
            executeCommand: (cmd: string, arg?: string) => void;
            insert: (s: string) => void;
            value: string;
            focus: () => void;
        } | null;

        if (mf) {
            mf.insert(symbolLatex);
            mf.focus();
            // Update latex state
            setTimeout(() => setLatex(mf.value || ''), 10);
        }
    }, []);

    // ── Insert into editor ───────────────────────────────────
    const handleInsert = useCallback(() => {
        if (!latex.trim()) return;

        let insertText: string;
        switch (wrapMode) {
            case 'inline':
                insertText = `$${latex}$`;
                break;
            case 'display':
                insertText = `\\[\n${latex}\n\\]`;
                break;
            case 'raw':
                insertText = latex;
                break;
        }

        onInsert(insertText, false);

        // Add to history
        setHistory((prev) => {
            const newEntry: HistoryEntry = { latex, timestamp: Date.now() };
            const updated = [newEntry, ...prev.filter((e) => e.latex !== latex)];
            return updated.slice(0, 20); // Keep last 20
        });
    }, [latex, wrapMode, onInsert]);

    // ── Copy LaTeX ───────────────────────────────────────────
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(latex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [latex]);

    // ── Clear ────────────────────────────────────────────────
    const handleClear = useCallback(() => {
        const mf = mathfieldRef.current as unknown as {
            value: string;
            focus: () => void;
        } | null;
        if (mf) {
            mf.value = '';
            mf.focus();
        }
        setLatex('');
    }, []);

    // ── Load from history ────────────────────────────────────
    const loadFromHistory = useCallback((entry: HistoryEntry) => {
        const mf = mathfieldRef.current as unknown as {
            value: string;
            focus: () => void;
        } | null;
        if (mf) {
            mf.value = entry.latex;
            mf.focus();
        }
        setLatex(entry.latex);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="mathsb-panel">
            {/* ── Header ──────────────────────────────────── */}
            <div className="mathsb-header">
                <div className="mathsb-title">
                    <span>📐</span>
                    <h3>Math Sandbox</h3>
                </div>
                <button className="mathsb-close" onClick={onClose}>✕</button>
            </div>

            {/* ── MathLive Editor ─────────────────────────── */}
            <div className="mathsb-editor-section">
                <div className="mathsb-editor" ref={containerRef} />
            </div>

            {/* ── Real-time LaTeX Output ──────────────────── */}
            <div className="mathsb-output">
                <div className="mathsb-output-header">
                    <span className="mathsb-output-label">LaTeX Code</span>
                    <button
                        className="mathsb-copy-btn"
                        onClick={handleCopy}
                    >
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                </div>
                <pre className="mathsb-latex-code">
                    {latex || '\\text{Start typing above…}'}
                </pre>
            </div>

            {/* ── Wrap Mode + Insert ─────────────────────── */}
            <div className="mathsb-insert-section">
                <div className="mathsb-wrap-modes">
                    <button
                        className={`mathsb-wrap-btn ${wrapMode === 'inline' ? 'active' : ''}`}
                        onClick={() => setWrapMode('inline')}
                        title="Inline math: $...$"
                    >
                        $…$
                    </button>
                    <button
                        className={`mathsb-wrap-btn ${wrapMode === 'display' ? 'active' : ''}`}
                        onClick={() => setWrapMode('display')}
                        title="Display math: \[...\]"
                    >
                        \[…\]
                    </button>
                    <button
                        className={`mathsb-wrap-btn ${wrapMode === 'raw' ? 'active' : ''}`}
                        onClick={() => setWrapMode('raw')}
                        title="Raw LaTeX (no wrapping)"
                    >
                        raw
                    </button>
                </div>

                <button
                    className="mathsb-insert-btn"
                    onClick={handleInsert}
                    disabled={!latex.trim()}
                >
                    ⏎ Insert at Cursor
                </button>
                <button className="mathsb-clear-btn" onClick={handleClear}>
                    Clear
                </button>
            </div>

            {/* ── Symbol Palette ──────────────────────────── */}
            <div className="mathsb-palette">
                <div className="mathsb-palette-tabs">
                    {SYMBOL_PALETTE.map((group, i) => (
                        <button
                            key={group.label}
                            className={`mathsb-palette-tab ${activeGroup === i ? 'active' : ''}`}
                            onClick={() => setActiveGroup(i)}
                            title={group.label}
                        >
                            {group.icon}
                        </button>
                    ))}
                </div>
                <div className="mathsb-palette-grid">
                    {SYMBOL_PALETTE[activeGroup].symbols.map((sym) => (
                        <button
                            key={sym.latex}
                            className="mathsb-symbol-btn"
                            onClick={() => insertSymbol(sym.latex)}
                            title={sym.desc || sym.latex}
                        >
                            {sym.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── History ─────────────────────────────────── */}
            {history.length > 0 && (
                <div className="mathsb-history">
                    <h4>Recent</h4>
                    <div className="mathsb-history-list">
                        {history.slice(0, 8).map((entry, i) => (
                            <button
                                key={i}
                                className="mathsb-history-item"
                                onClick={() => loadFromHistory(entry)}
                                title={entry.latex}
                            >
                                <span className="mathsb-history-latex">
                                    {entry.latex.length > 40 ? entry.latex.slice(0, 40) + '…' : entry.latex}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Styles ──────────────────────────────────── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .mathsb-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #1a1b26;
                    color: #e1e2e8;
                    font-size: 13px;
                    overflow-y: auto;
                }

                .mathsb-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    border-bottom: 1px solid #2a2d3e;
                    flex-shrink: 0;
                }
                .mathsb-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .mathsb-title h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                }
                .mathsb-close {
                    background: none;
                    border: none;
                    color: #6b7280;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                .mathsb-close:hover { background: #2a2d3e; color: #e1e2e8; }

                /* ── Editor ──────────────────────────────── */
                .mathsb-editor-section {
                    padding: 12px 16px;
                    flex-shrink: 0;
                }
                .mathsb-editor {
                    border-radius: 12px;
                    overflow: hidden;
                }
                /* MathLive custom property overrides */
                .mathsb-editor math-field {
                    --hue: 240;
                    --primary: #4f46e5;
                }

                /* ── LaTeX Output ────────────────────────── */
                .mathsb-output {
                    padding: 0 16px 12px;
                    flex-shrink: 0;
                }
                .mathsb-output-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                .mathsb-output-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .mathsb-copy-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    font-size: 11px;
                    cursor: pointer;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .mathsb-copy-btn:hover { color: #a5b4fc; }

                .mathsb-latex-code {
                    margin: 0;
                    padding: 10px 12px;
                    border-radius: 8px;
                    background: #0d0e14;
                    border: 1px solid #2a2d3e;
                    color: #a5f3a8;
                    font-family: 'SF Mono', 'Fira Code', monospace;
                    font-size: 12px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-break: break-all;
                    max-height: 80px;
                    overflow-y: auto;
                }

                /* ── Insert Section ──────────────────────── */
                .mathsb-insert-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 16px 12px;
                    flex-shrink: 0;
                }
                .mathsb-wrap-modes {
                    display: flex;
                    border: 1px solid #2a2d3e;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .mathsb-wrap-btn {
                    padding: 6px 10px;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    font-size: 11px;
                    font-family: 'SF Mono', monospace;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .mathsb-wrap-btn:not(:last-child) {
                    border-right: 1px solid #2a2d3e;
                }
                .mathsb-wrap-btn.active {
                    background: #4f46e5;
                    color: white;
                }
                .mathsb-wrap-btn:hover:not(.active) { background: #1e1f2e; }

                .mathsb-insert-btn {
                    flex: 1;
                    padding: 8px 14px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .mathsb-insert-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                }
                .mathsb-insert-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .mathsb-clear-btn {
                    padding: 8px 12px;
                    border: 1px solid #2a2d3e;
                    border-radius: 8px;
                    background: transparent;
                    color: #6b7280;
                    font-size: 12px;
                    cursor: pointer;
                }
                .mathsb-clear-btn:hover { border-color: #ef4444; color: #f87171; }

                /* ── Symbol Palette ───────────────────────── */
                .mathsb-palette {
                    padding: 0 16px 12px;
                    flex-shrink: 0;
                }
                .mathsb-palette-tabs {
                    display: flex;
                    gap: 2px;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #2a2d3e;
                    padding-bottom: 6px;
                }
                .mathsb-palette-tab {
                    padding: 4px 10px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: #6b7280;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .mathsb-palette-tab:hover { background: #1e1f2e; }
                .mathsb-palette-tab.active {
                    background: #2a2d3e;
                    color: #e1e2e8;
                }

                .mathsb-palette-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
                    gap: 4px;
                }
                .mathsb-symbol-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 36px;
                    border: 1px solid #2a2d3e;
                    border-radius: 6px;
                    background: #111218;
                    color: #e1e2e8;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.1s;
                }
                .mathsb-symbol-btn:hover {
                    border-color: #4f46e5;
                    background: #1e1f2e;
                    transform: scale(1.1);
                }

                /* ── History ──────────────────────────────── */
                .mathsb-history {
                    padding: 0 16px 16px;
                    flex-shrink: 0;
                }
                .mathsb-history h4 {
                    font-size: 11px;
                    font-weight: 500;
                    color: #6b7280;
                    margin: 0 0 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .mathsb-history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .mathsb-history-item {
                    display: block;
                    width: 100%;
                    padding: 6px 10px;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    background: transparent;
                    color: #9ca3af;
                    font-size: 11px;
                    font-family: 'SF Mono', monospace;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.1s;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .mathsb-history-item:hover {
                    background: #1e1f2e;
                    border-color: #2a2d3e;
                    color: #c7d2fe;
                }

                .mathsb-history-latex {
                    pointer-events: none;
                }
            `}} />
        </div>
    );
}

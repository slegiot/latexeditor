'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — Chemistry Editor Modal
// ─────────────────────────────────────────────────────────────
// Integrated chemistry tool combining:
//   ✦ mhchem equation builder with instant KaTeX preview
//   ✦ SMILES → ChemFig structure converter
//   ✦ Molecule template library
//   ✦ Common reaction templates
//   ✦ Insert at cursor in the editor
//
// Dependencies: katex (npm), katex/contrib/mhchem
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    MOLECULE_TEMPLATES,
    EQUATION_TEMPLATES,
    smilesToChemFig,
} from '@/lib/chemfig-converter';

// ── Types ────────────────────────────────────────────────────

interface ChemistryEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (latex: string) => void;
}

type TabId = 'equations' | 'structures' | 'templates';

// ── Component ────────────────────────────────────────────────

export default function ChemistryEditor({ isOpen, onClose, onInsert }: ChemistryEditorProps) {
    const [activeTab, setActiveTab] = useState<TabId>('equations');
    const [ceInput, setCeInput] = useState('');
    const [smilesInput, setSmilesInput] = useState('');
    const [chemfigOutput, setChemfigOutput] = useState('');
    const [conversionWarnings, setConversionWarnings] = useState<string[]>([]);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewError, setPreviewError] = useState('');
    const [copied, setCopied] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    // ── KaTeX Preview ────────────────────────────────────────
    useEffect(() => {
        if (!ceInput.trim()) {
            setPreviewHtml('');
            setPreviewError('');
            return;
        }

        const renderPreview = async () => {
            try {
                const katex = (await import('katex')).default;
                // Load mhchem extension
                await import('katex/contrib/mhchem');

                const html = katex.renderToString(ceInput, {
                    throwOnError: false,
                    displayMode: true,
                    trust: true,
                });
                setPreviewHtml(html);
                setPreviewError('');
            } catch (err) {
                setPreviewError((err as Error).message);
                setPreviewHtml('');
            }
        };

        // Debounce
        const timer = setTimeout(renderPreview, 150);
        return () => clearTimeout(timer);
    }, [ceInput]);

    // ── SMILES Conversion ────────────────────────────────────
    const handleConvertSMILES = useCallback(() => {
        if (!smilesInput.trim()) return;

        const result = smilesToChemFig(smilesInput.trim());
        setChemfigOutput(result.chemfig);
        setConversionWarnings(result.warnings);
    }, [smilesInput]);

    // ── Insert handlers ──────────────────────────────────────
    const handleInsertEquation = useCallback(() => {
        if (!ceInput.trim()) return;
        onInsert(ceInput);
    }, [ceInput, onInsert]);

    const handleInsertChemfig = useCallback(() => {
        if (!chemfigOutput.trim()) return;
        onInsert(`\\chemfig{${chemfigOutput}}`);
    }, [chemfigOutput, onInsert]);

    const handleInsertTemplate = useCallback((latex: string) => {
        onInsert(latex);
    }, [onInsert]);

    // ── Copy ─────────────────────────────────────────────────
    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, []);

    // ── Load molecule template ───────────────────────────────
    const handleLoadMolecule = useCallback((key: string) => {
        const mol = MOLECULE_TEMPLATES[key];
        if (mol) {
            setSmilesInput(mol.smiles);
            setChemfigOutput(mol.chemfig);
            setConversionWarnings([]);
            setActiveTab('structures');
        }
    }, []);

    // ── Keyboard shortcut ────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // ── Element palette ──────────────────────────────────────
    const ELEMENTS = useMemo(() => [
        { symbol: 'H', name: 'Hydrogen' }, { symbol: 'C', name: 'Carbon' },
        { symbol: 'N', name: 'Nitrogen' }, { symbol: 'O', name: 'Oxygen' },
        { symbol: 'S', name: 'Sulfur' }, { symbol: 'P', name: 'Phosphorus' },
        { symbol: 'F', name: 'Fluorine' }, { symbol: 'Cl', name: 'Chlorine' },
        { symbol: 'Br', name: 'Bromine' }, { symbol: 'I', name: 'Iodine' },
        { symbol: 'Na', name: 'Sodium' }, { symbol: 'K', name: 'Potassium' },
        { symbol: 'Ca', name: 'Calcium' }, { symbol: 'Fe', name: 'Iron' },
        { symbol: 'Zn', name: 'Zinc' }, { symbol: 'Cu', name: 'Copper' },
    ], []);

    const CE_HELPERS = useMemo(() => [
        { label: '→', insert: ' -> ', desc: 'Yields' },
        { label: '⇌', insert: ' <=> ', desc: 'Equilibrium' },
        { label: '⇋', insert: ' <=>> ', desc: 'Favours right' },
        { label: '↑', insert: ' ^ ', desc: 'Gas evolved' },
        { label: '↓', insert: ' v ', desc: 'Precipitate' },
        { label: '(aq)', insert: ' (aq)', desc: 'Aqueous' },
        { label: '(s)', insert: ' (s)', desc: 'Solid' },
        { label: '(l)', insert: ' (l)', desc: 'Liquid' },
        { label: '(g)', insert: ' (g)', desc: 'Gas' },
        { label: '^{2+}', insert: '^{2+}', desc: 'Charge' },
        { label: 'Δ', insert: '->[\\Delta]', desc: 'Heat' },
        { label: 'cat.', insert: '->[ cat. ]', desc: 'Catalyst' },
    ], []);

    if (!isOpen) return null;

    return (
        <div className="chem-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="chem-modal" role="dialog" aria-label="Chemistry Editor">
                {/* ── Header ──────────────────────────────── */}
                <div className="chem-header">
                    <div className="chem-title">
                        <span>🧪</span>
                        <h2>Chemistry Editor</h2>
                    </div>
                    <button className="chem-close" onClick={onClose}>✕</button>
                </div>

                {/* ── Tabs ────────────────────────────────── */}
                <div className="chem-tabs">
                    <button
                        className={`chem-tab ${activeTab === 'equations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('equations')}
                    >
                        ⚗️ Equations
                    </button>
                    <button
                        className={`chem-tab ${activeTab === 'structures' ? 'active' : ''}`}
                        onClick={() => setActiveTab('structures')}
                    >
                        🔬 Structures
                    </button>
                    <button
                        className={`chem-tab ${activeTab === 'templates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('templates')}
                    >
                        📋 Templates
                    </button>
                </div>

                {/* ── Equations Tab ────────────────────────── */}
                {activeTab === 'equations' && (
                    <div className="chem-content">
                        {/* mhchem input */}
                        <div className="chem-section">
                            <label className="chem-label">Chemical Equation (mhchem syntax)</label>
                            <div className="chem-ce-wrapper">
                                <span className="chem-ce-prefix">{'\\ce{'}</span>
                                <input
                                    type="text"
                                    value={ceInput}
                                    onChange={(e) => setCeInput(e.target.value)}
                                    className="chem-ce-input"
                                    placeholder="H2O + NaOH -> NaCl + H2O"
                                    autoFocus
                                />
                                <span className="chem-ce-suffix">{'}'}</span>
                            </div>
                        </div>

                        {/* Quick helpers */}
                        <div className="chem-helpers">
                            {CE_HELPERS.map((h) => (
                                <button
                                    key={h.label}
                                    className="chem-helper-btn"
                                    onClick={() => setCeInput((prev) => prev + h.insert)}
                                    title={h.desc}
                                >
                                    {h.label}
                                </button>
                            ))}
                        </div>

                        {/* Element palette */}
                        <div className="chem-section">
                            <label className="chem-label">Elements</label>
                            <div className="chem-elements">
                                {ELEMENTS.map((el) => (
                                    <button
                                        key={el.symbol}
                                        className="chem-element-btn"
                                        onClick={() => setCeInput((prev) => prev + el.symbol)}
                                        title={el.name}
                                    >
                                        {el.symbol}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="chem-section">
                            <label className="chem-label">Preview</label>
                            <div className="chem-preview-box" ref={previewRef}>
                                {previewHtml ? (
                                    <div
                                        className="chem-preview-rendered"
                                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                                    />
                                ) : previewError ? (
                                    <div className="chem-preview-error">{previewError}</div>
                                ) : (
                                    <div className="chem-preview-placeholder">
                                        Type an equation above to see a live preview
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* LaTeX code */}
                        {ceInput.trim() && (
                            <div className="chem-section">
                                <label className="chem-label">LaTeX Code</label>
                                <pre className="chem-code-block">
                                    {`\\ce{${ceInput}}`}
                                </pre>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="chem-actions">
                            <button
                                className="chem-insert-btn"
                                onClick={handleInsertEquation}
                                disabled={!ceInput.trim()}
                            >
                                ⏎ Insert \\ce&#123;...&#125;
                            </button>
                            <button
                                className="chem-copy-btn"
                                onClick={() => handleCopy(`\\ce{${ceInput}}`)}
                                disabled={!ceInput.trim()}
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Structures Tab ───────────────────────── */}
                {activeTab === 'structures' && (
                    <div className="chem-content">
                        {/* SMILES input */}
                        <div className="chem-section">
                            <label className="chem-label">SMILES Notation</label>
                            <div className="chem-smiles-row">
                                <input
                                    type="text"
                                    value={smilesInput}
                                    onChange={(e) => setSmilesInput(e.target.value)}
                                    className="chem-smiles-input"
                                    placeholder="e.g. CCO (ethanol), c1ccccc1 (benzene)"
                                    onKeyDown={(e) => e.key === 'Enter' && handleConvertSMILES()}
                                />
                                <button className="chem-convert-btn" onClick={handleConvertSMILES}>
                                    Convert
                                </button>
                            </div>
                        </div>

                        {/* Molecule templates */}
                        <div className="chem-section">
                            <label className="chem-label">Common Molecules</label>
                            <div className="chem-molecule-grid">
                                {Object.entries(MOLECULE_TEMPLATES).map(([key, mol]) => (
                                    <button
                                        key={key}
                                        className="chem-molecule-btn"
                                        onClick={() => handleLoadMolecule(key)}
                                    >
                                        <span className="chem-mol-name">{mol.name}</span>
                                        <span className="chem-mol-smiles">{mol.smiles}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Warnings */}
                        {conversionWarnings.length > 0 && (
                            <div className="chem-warnings">
                                {conversionWarnings.map((w, i) => (
                                    <span key={i}>⚠ {w}</span>
                                ))}
                            </div>
                        )}

                        {/* ChemFig output */}
                        {chemfigOutput && (
                            <div className="chem-section">
                                <label className="chem-label">ChemFig Output</label>
                                <pre className="chem-code-block">
                                    {`\\chemfig{${chemfigOutput}}`}
                                </pre>
                                <div className="chem-actions">
                                    <button
                                        className="chem-insert-btn"
                                        onClick={handleInsertChemfig}
                                    >
                                        ⏎ Insert \\chemfig&#123;...&#125;
                                    </button>
                                    <button
                                        className="chem-copy-btn"
                                        onClick={() => handleCopy(`\\chemfig{${chemfigOutput}}`)}
                                    >
                                        {copied ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Required packages note */}
                        <div className="chem-package-note">
                            Requires: <code>\\usepackage&#123;chemfig&#125;</code>
                        </div>
                    </div>
                )}

                {/* ── Templates Tab ────────────────────────── */}
                {activeTab === 'templates' && (
                    <div className="chem-content">
                        <div className="chem-section">
                            <label className="chem-label">Reaction Templates</label>
                            <div className="chem-template-list">
                                {EQUATION_TEMPLATES.map((tmpl, i) => (
                                    <TemplateCard
                                        key={i}
                                        template={tmpl}
                                        onInsert={handleInsertTemplate}
                                        onCopy={handleCopy}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{ __html: STYLES }} />
                {/* KaTeX CSS */}
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
                    crossOrigin="anonymous"
                />
            </div>
        </div>
    );
}

// ── Template Card ────────────────────────────────────────────

function TemplateCard({
    template,
    onInsert,
    onCopy,
}: {
    template: { label: string; latex: string };
    onInsert: (latex: string) => void;
    onCopy: (text: string) => void;
}) {
    const [previewHtml, setPreviewHtml] = useState('');

    useEffect(() => {
        const render = async () => {
            try {
                const katex = (await import('katex')).default;
                await import('katex/contrib/mhchem');
                const html = katex.renderToString(template.latex, {
                    throwOnError: false,
                    displayMode: true,
                    trust: true,
                });
                setPreviewHtml(html);
            } catch {
                // Silently fail for templates
            }
        };
        render();
    }, [template.latex]);

    return (
        <div className="chem-template-card">
            <div className="chem-template-top">
                <span className="chem-template-label">{template.label}</span>
                <div className="chem-template-actions">
                    <button
                        className="chem-copy-btn small"
                        onClick={() => onCopy(template.latex)}
                        title="Copy"
                    >
                        📋
                    </button>
                    <button
                        className="chem-insert-sm-btn"
                        onClick={() => onInsert(template.latex)}
                    >
                        Insert
                    </button>
                </div>
            </div>
            {previewHtml && (
                <div
                    className="chem-template-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
            )}
            <code className="chem-template-code">{template.latex}</code>
        </div>
    );
}

// ── Styles ───────────────────────────────────────────────────

const STYLES = `
.chem-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
}
.chem-modal {
    background: #1a1b26;
    border: 1px solid #2a2d3e;
    border-radius: 16px;
    width: 95vw;
    max-width: 820px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    animation: chemSlide 0.2s ease;
}
@keyframes chemSlide { from { transform: translateY(16px); opacity: 0; } }

.chem-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid #2a2d3e;
}
.chem-title { display: flex; align-items: center; gap: 10px; }
.chem-title h2 { margin: 0; font-size: 17px; font-weight: 600; color: #e1e2e8; }
.chem-close {
    background: none; border: none; color: #6b7280;
    font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px;
}
.chem-close:hover { background: #2a2d3e; color: #e1e2e8; }

/* ── Tabs ──────────────────────────────────────── */
.chem-tabs {
    display: flex;
    border-bottom: 1px solid #2a2d3e;
    padding: 0 24px;
}
.chem-tab {
    padding: 10px 18px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
}
.chem-tab:hover { color: #c7d2fe; }
.chem-tab.active { color: #e1e2e8; border-bottom-color: #4f46e5; }

/* ── Content ──────────────────────────────────── */
.chem-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
}
.chem-section { margin-bottom: 16px; }
.chem-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
}

/* ── mhchem Input ─────────────────────────────── */
.chem-ce-wrapper {
    display: flex;
    align-items: center;
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    background: #0d0e14;
    overflow: hidden;
}
.chem-ce-prefix, .chem-ce-suffix {
    padding: 10px 8px;
    font-family: 'SF Mono', monospace;
    font-size: 13px;
    color: #6b7280;
    background: #111218;
}
.chem-ce-input {
    flex: 1;
    padding: 10px 8px;
    border: none;
    background: transparent;
    color: #e1e2e8;
    font-family: 'SF Mono', monospace;
    font-size: 14px;
    outline: none;
}

/* ── Helpers ──────────────────────────────────── */
.chem-helpers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 14px;
}
.chem-helper-btn {
    padding: 4px 10px;
    border: 1px solid #2a2d3e;
    border-radius: 6px;
    background: #111218;
    color: #9ca3af;
    font-size: 12px;
    font-family: monospace;
    cursor: pointer;
    transition: all 0.1s;
}
.chem-helper-btn:hover { border-color: #4f46e5; color: #c7d2fe; }

/* ── Elements ─────────────────────────────────── */
.chem-elements {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: 4px;
}
.chem-element-btn {
    height: 36px;
    border: 1px solid #2a2d3e;
    border-radius: 6px;
    background: #111218;
    color: #e1e2e8;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.1s;
}
.chem-element-btn:hover { border-color: #059669; background: rgba(5,150,105,0.1); transform: scale(1.05); }

/* ── Preview ──────────────────────────────────── */
.chem-preview-box {
    min-height: 60px;
    padding: 16px;
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    background: #111218;
    display: flex;
    align-items: center;
    justify-content: center;
}
.chem-preview-rendered { font-size: 20px; }
.chem-preview-placeholder { color: #4b5563; font-size: 13px; }
.chem-preview-error { color: #f87171; font-size: 12px; }

/* ── Code Block ───────────────────────────────── */
.chem-code-block {
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
}

/* ── Actions ──────────────────────────────────── */
.chem-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}
.chem-insert-btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #059669, #10b981);
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}
.chem-insert-btn:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
.chem-insert-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.chem-copy-btn {
    padding: 8px 12px;
    border: 1px solid #2a2d3e;
    border-radius: 8px;
    background: transparent;
    color: #6b7280;
    font-size: 14px;
    cursor: pointer;
}
.chem-copy-btn.small { padding: 4px 8px; font-size: 12px; }
.chem-copy-btn:hover { border-color: #4f46e5; }
.chem-copy-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── SMILES ───────────────────────────────────── */
.chem-smiles-row { display: flex; gap: 8px; }
.chem-smiles-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    background: #0d0e14;
    color: #e1e2e8;
    font-family: monospace;
    font-size: 14px;
    outline: none;
}
.chem-smiles-input:focus { border-color: #4f46e5; }
.chem-convert-btn {
    padding: 10px 18px;
    border: none;
    border-radius: 10px;
    background: #4f46e5;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

/* ── Molecule Grid ────────────────────────────── */
.chem-molecule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 6px;
}
.chem-molecule-btn {
    display: flex;
    flex-direction: column;
    padding: 10px;
    border: 1px solid #2a2d3e;
    border-radius: 8px;
    background: #111218;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
}
.chem-molecule-btn:hover { border-color: #4f46e5; background: #1e1f2e; }
.chem-mol-name { font-size: 12px; font-weight: 500; color: #e1e2e8; }
.chem-mol-smiles { font-size: 10px; color: #6b7280; font-family: monospace; margin-top: 2px; }

/* ── Warnings ─────────────────────────────────── */
.chem-warnings {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background: rgba(245,158,11,0.1);
    border-radius: 8px;
    margin-bottom: 12px;
}
.chem-warnings span { font-size: 12px; color: #fbbf24; }

/* ── Package Note ─────────────────────────────── */
.chem-package-note {
    font-size: 11px;
    color: #4b5563;
    text-align: center;
    padding-top: 8px;
}
.chem-package-note code {
    font-family: monospace;
    color: #6b7280;
}

/* ── Templates ────────────────────────────────── */
.chem-template-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.chem-template-card {
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    padding: 12px 14px;
}
.chem-template-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.chem-template-label { font-size: 13px; font-weight: 500; color: #e1e2e8; }
.chem-template-actions { display: flex; gap: 6px; }
.chem-insert-sm-btn {
    padding: 4px 12px;
    border: 1px solid #2a2d3e;
    border-radius: 6px;
    background: transparent;
    color: #9ca3af;
    font-size: 11px;
    cursor: pointer;
}
.chem-insert-sm-btn:hover { border-color: #059669; color: #4ade80; }

.chem-template-preview {
    padding: 8px;
    background: #0d0e14;
    border-radius: 6px;
    text-align: center;
    margin-bottom: 6px;
}
.chem-template-code {
    display: block;
    font-family: 'SF Mono', monospace;
    font-size: 11px;
    color: #6b7280;
    overflow-x: auto;
}
`;

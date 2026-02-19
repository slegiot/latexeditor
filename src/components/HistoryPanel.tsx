'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — History Panel (Sidebar)
// ─────────────────────────────────────────────────────────────
// Project history sidebar showing:
//   ✦ Timeline of version snapshots
//   ✦ Green/red diff view comparing two versions
//   ✦ One-click restore to any previous version
//   ✦ Manual snapshot creation with labels
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import type { VersionMeta, DiffData } from '@/hooks/useVersionHistory';
import type { DiffLine } from '@/lib/diff';

// ── Props ────────────────────────────────────────────────────

interface HistoryPanelProps {
    versions: VersionMeta[];
    isLoading: boolean;
    error: string | null;
    activeDiff: DiffData | null;
    onCreateSnapshot: (label: string) => void;
    onComputeDiff: (versionA: string, versionB: string) => void;
    onRestore: (versionId: string) => void;
    onDelete: (versionId: string) => void;
    onClearDiff: () => void;
    onRefresh: () => void;
}

// ── Component ────────────────────────────────────────────────

export default function HistoryPanel({
    versions,
    isLoading,
    error,
    activeDiff,
    onCreateSnapshot,
    onComputeDiff,
    onRestore,
    onDelete,
    onClearDiff,
    onRefresh,
}: HistoryPanelProps) {
    const [snapshotLabel, setSnapshotLabel] = useState('');
    const [showNewSnapshot, setShowNewSnapshot] = useState(false);
    const [selectedA, setSelectedA] = useState<string | null>(null);
    const [selectedB, setSelectedB] = useState<string | null>(null);
    const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

    // ── Save snapshot ────────────────────────────────────────
    const handleSave = useCallback(() => {
        if (!snapshotLabel.trim()) return;
        onCreateSnapshot(snapshotLabel.trim());
        setSnapshotLabel('');
        setShowNewSnapshot(false);
    }, [snapshotLabel, onCreateSnapshot]);

    // ── Compare ──────────────────────────────────────────────
    const handleCompare = useCallback(() => {
        if (selectedA && selectedB && selectedA !== selectedB) {
            onComputeDiff(selectedA, selectedB);
        }
    }, [selectedA, selectedB, onComputeDiff]);

    // ── Version selection ────────────────────────────────────
    const handleVersionClick = useCallback((id: string) => {
        if (!selectedA) {
            setSelectedA(id);
        } else if (!selectedB && id !== selectedA) {
            setSelectedB(id);
        } else {
            setSelectedA(id);
            setSelectedB(null);
            onClearDiff();
        }
    }, [selectedA, selectedB, onClearDiff]);

    // ── Restore ──────────────────────────────────────────────
    const handleRestore = useCallback((id: string) => {
        if (confirmRestore === id) {
            onRestore(id);
            setConfirmRestore(null);
        } else {
            setConfirmRestore(id);
            // Auto-dismiss after 3 seconds
            setTimeout(() => setConfirmRestore(null), 3000);
        }
    }, [confirmRestore, onRestore]);

    return (
        <div className="history-panel">
            {/* ── Header ──────────────────────────────────── */}
            <div className="history-header">
                <h3>📜 Project History</h3>
                <div className="history-header-actions">
                    <button
                        className="history-icon-btn"
                        onClick={onRefresh}
                        title="Refresh"
                    >
                        ↻
                    </button>
                    <button
                        className="history-icon-btn"
                        onClick={() => setShowNewSnapshot(!showNewSnapshot)}
                        title="New Snapshot"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* ── New Snapshot Form ────────────────────────── */}
            {showNewSnapshot && (
                <div className="history-new-snapshot">
                    <input
                        type="text"
                        value={snapshotLabel}
                        onChange={(e) => setSnapshotLabel(e.target.value)}
                        placeholder="Snapshot label..."
                        className="history-input"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        autoFocus
                    />
                    <button className="history-save-btn" onClick={handleSave}>
                        Save
                    </button>
                </div>
            )}

            {/* ── Compare Bar ─────────────────────────────── */}
            {(selectedA || selectedB) && (
                <div className="history-compare-bar">
                    <span className="history-compare-label">
                        {selectedA && selectedB
                            ? 'Comparing 2 versions'
                            : 'Select another version to compare'}
                    </span>
                    {selectedA && selectedB && (
                        <button className="history-compare-btn" onClick={handleCompare}>
                            Compare
                        </button>
                    )}
                    <button
                        className="history-compare-clear"
                        onClick={() => { setSelectedA(null); setSelectedB(null); onClearDiff(); }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ── Error ───────────────────────────────────── */}
            {error && (
                <div className="history-error">⚠ {error}</div>
            )}

            {/* ── Diff View ───────────────────────────────── */}
            {activeDiff && (
                <div className="history-diff-section">
                    <div className="history-diff-header">
                        <span className="diff-stat diff-additions">+{activeDiff.additions}</span>
                        <span className="diff-stat diff-deletions">-{activeDiff.deletions}</span>
                        <span className="diff-stat diff-unchanged">{activeDiff.unchanged} unchanged</span>
                        <button className="history-icon-btn" onClick={onClearDiff}>✕</button>
                    </div>
                    <div className="history-diff-view">
                        {activeDiff.lines.map((line, i) => (
                            <DiffLineRow key={i} line={line} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Version List ────────────────────────────── */}
            <div className="history-list">
                {isLoading && versions.length === 0 && (
                    <div className="history-loading">Loading versions...</div>
                )}

                {!isLoading && versions.length === 0 && (
                    <div className="history-empty">
                        <span className="history-empty-icon">📄</span>
                        <p>No snapshots yet</p>
                        <p className="history-empty-hint">
                            Click + to save your first snapshot
                        </p>
                    </div>
                )}

                {versions.map((version) => (
                    <div
                        key={version.id}
                        className={`history-item ${selectedA === version.id ? 'selected-a' : ''
                            } ${selectedB === version.id ? 'selected-b' : ''}`}
                        onClick={() => handleVersionClick(version.id)}
                    >
                        <div className="history-item-left">
                            <div className="history-item-dot">
                                {version.is_auto ? (
                                    <span className="dot-auto" />
                                ) : (
                                    <span className="dot-manual" />
                                )}
                            </div>
                            <div className="history-item-info">
                                <span className="history-item-label">
                                    {version.label}
                                </span>
                                <span className="history-item-time">
                                    {formatTime(version.created_at)}
                                </span>
                                <span className="history-item-size">
                                    {formatSize(version.content_length)}
                                </span>
                            </div>
                        </div>

                        <div className="history-item-actions">
                            <button
                                className={`history-restore-btn ${confirmRestore === version.id ? 'confirm' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleRestore(version.id); }}
                                title={confirmRestore === version.id ? 'Click again to confirm' : 'Restore this version'}
                            >
                                {confirmRestore === version.id ? '⚠ Confirm?' : '↩ Restore'}
                            </button>
                            <button
                                className="history-delete-btn"
                                onClick={(e) => { e.stopPropagation(); onDelete(version.id); }}
                                title="Delete snapshot"
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Styles ──────────────────────────────────── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .history-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #1a1b26;
                    color: #e1e2e8;
                    font-size: 13px;
                }

                .history-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    border-bottom: 1px solid #2a2d3e;
                }
                .history-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                }
                .history-header-actions {
                    display: flex;
                    gap: 4px;
                }

                .history-icon-btn {
                    background: none;
                    border: 1px solid transparent;
                    color: #9ca3af;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 2px 6px;
                    border-radius: 6px;
                    transition: all 0.15s;
                }
                .history-icon-btn:hover {
                    background: #2a2d3e;
                    color: #e1e2e8;
                }

                /* ── New Snapshot ────────────────────────── */
                .history-new-snapshot {
                    display: flex;
                    gap: 6px;
                    padding: 10px 16px;
                    border-bottom: 1px solid #2a2d3e;
                }
                .history-input {
                    flex: 1;
                    padding: 6px 10px;
                    border: 1px solid #2a2d3e;
                    border-radius: 6px;
                    background: #111218;
                    color: #e1e2e8;
                    font-size: 12px;
                    outline: none;
                }
                .history-input:focus { border-color: #4f46e5; }
                .history-save-btn {
                    padding: 6px 14px;
                    border: none;
                    border-radius: 6px;
                    background: #4f46e5;
                    color: white;
                    font-size: 12px;
                    cursor: pointer;
                }

                /* ── Compare Bar ────────────────────────── */
                .history-compare-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #1e1f2e;
                    border-bottom: 1px solid #2a2d3e;
                }
                .history-compare-label {
                    flex: 1;
                    font-size: 11px;
                    color: #9ca3af;
                }
                .history-compare-btn {
                    padding: 4px 12px;
                    border: none;
                    border-radius: 6px;
                    background: #4f46e5;
                    color: white;
                    font-size: 11px;
                    cursor: pointer;
                }
                .history-compare-clear {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 12px;
                }

                /* ── Error ──────────────────────────────── */
                .history-error {
                    padding: 8px 16px;
                    background: rgba(239, 68, 68, 0.1);
                    color: #fca5a5;
                    font-size: 12px;
                }

                /* ── Diff View ──────────────────────────── */
                .history-diff-section {
                    border-bottom: 1px solid #2a2d3e;
                }
                .history-diff-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: #111218;
                    border-bottom: 1px solid #2a2d3e;
                }
                .diff-stat {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .diff-additions {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                }
                .diff-deletions {
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                }
                .diff-unchanged {
                    color: #6b7280;
                    font-weight: 400;
                }

                .history-diff-view {
                    max-height: 300px;
                    overflow-y: auto;
                    font-family: 'SF Mono', 'Fira Code', monospace;
                    font-size: 11px;
                    line-height: 1.5;
                }

                .diff-line {
                    display: flex;
                    white-space: pre;
                    padding: 0 16px 0 0;
                }
                .diff-line-number {
                    flex: 0 0 70px;
                    display: flex;
                    text-align: right;
                    color: #4b5563;
                    user-select: none;
                    padding: 0 4px;
                }
                .diff-line-num-old,
                .diff-line-num-new {
                    flex: 1;
                    text-align: right;
                    padding-right: 4px;
                }
                .diff-line-indicator {
                    flex: 0 0 16px;
                    text-align: center;
                    font-weight: 700;
                }
                .diff-line-content {
                    flex: 1;
                    overflow-x: auto;
                    padding-left: 4px;
                }

                .diff-line.diff-add {
                    background: rgba(34, 197, 94, 0.08);
                }
                .diff-line.diff-add .diff-line-indicator { color: #4ade80; }
                .diff-line.diff-add .diff-line-content { color: #bbf7d0; }

                .diff-line.diff-remove {
                    background: rgba(239, 68, 68, 0.08);
                }
                .diff-line.diff-remove .diff-line-indicator { color: #f87171; }
                .diff-line.diff-remove .diff-line-content { color: #fecaca; }

                .diff-line.diff-equal .diff-line-content { color: #9ca3af; }

                /* ── Version List ───────────────────────── */
                .history-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .history-loading,
                .history-empty {
                    padding: 30px 16px;
                    text-align: center;
                    color: #6b7280;
                }
                .history-empty-icon { font-size: 32px; }
                .history-empty p { margin: 4px 0; }
                .history-empty-hint { font-size: 11px; }

                .history-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: background 0.1s;
                    border-left: 3px solid transparent;
                }
                .history-item:hover {
                    background: #1e1f2e;
                }
                .history-item.selected-a {
                    border-left-color: #4f46e5;
                    background: rgba(79, 70, 229, 0.08);
                }
                .history-item.selected-b {
                    border-left-color: #7c3aed;
                    background: rgba(124, 58, 237, 0.08);
                }

                .history-item-left {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    flex: 1;
                    min-width: 0;
                }

                .history-item-dot {
                    padding-top: 4px;
                }
                .dot-manual, .dot-auto {
                    display: block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .dot-manual { background: #4f46e5; }
                .dot-auto { background: #3a3d4e; }

                .history-item-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .history-item-label {
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .history-item-time {
                    font-size: 11px;
                    color: #6b7280;
                }
                .history-item-size {
                    font-size: 10px;
                    color: #4b5563;
                }

                .history-item-actions {
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.15s;
                }
                .history-item:hover .history-item-actions { opacity: 1; }

                .history-restore-btn {
                    padding: 4px 10px;
                    border: 1px solid #2a2d3e;
                    border-radius: 6px;
                    background: transparent;
                    color: #9ca3af;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.15s;
                    white-space: nowrap;
                }
                .history-restore-btn:hover {
                    border-color: #059669;
                    color: #34d399;
                }
                .history-restore-btn.confirm {
                    background: rgba(239, 68, 68, 0.15);
                    border-color: #ef4444;
                    color: #fca5a5;
                    animation: pulse 1s ease infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .history-delete-btn {
                    background: none;
                    border: none;
                    color: #4b5563;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 4px;
                }
                .history-delete-btn:hover { color: #f87171; }
            `}} />
        </div>
    );
}

// ── Diff Line Sub-Component ──────────────────────────────────

function DiffLineRow({ line }: { line: DiffLine }) {
    const indicator = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
    const className = `diff-line diff-${line.type}`;

    return (
        <div className={className}>
            <div className="diff-line-number">
                <span className="diff-line-num-old">
                    {line.oldLineNumber ?? ''}
                </span>
                <span className="diff-line-num-new">
                    {line.newLineNumber ?? ''}
                </span>
            </div>
            <span className="diff-line-indicator">{indicator}</span>
            <span className="diff-line-content">{line.content}</span>
        </div>
    );
}

// ── Formatters ───────────────────────────────────────────────

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

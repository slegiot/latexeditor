'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — Package Manager Component
// ─────────────────────────────────────────────────────────────
// UI panel where users can browse and toggle LaTeX packages.
// Toggling a package automatically updates the preamble.
//
// Features:
//   ✦ Categorised package grid with search
//   ✦ Toggle switches that add/remove \usepackage lines
//   ✦ Dependency auto-resolution
//   ✦ Shows which packages are already enabled
//   ✦ Examples and descriptions
// ─────────────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react';
import {
    PACKAGE_REGISTRY,
    CATEGORY_LABELS,
    detectEnabledPackages,
    togglePackage,
} from '@/lib/latex-packages';
import type { PackageInfo, PackageCategory } from '@/lib/latex-packages';

// ── Props ────────────────────────────────────────────────────

interface PackageManagerProps {
    /** Current document source */
    source: string;
    /** Called when the source is updated (preamble changed) */
    onSourceChange: (newSource: string) => void;
    /** Whether the panel is open */
    isOpen: boolean;
    /** Close the panel */
    onClose: () => void;
}

// ── Component ────────────────────────────────────────────────

export default function PackageManager({
    source,
    onSourceChange,
    isOpen,
    onClose,
}: PackageManagerProps) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<PackageCategory | 'all'>('all');

    // Detect currently enabled packages
    const enabledPackages = useMemo(() => detectEnabledPackages(source), [source]);

    // Filter packages
    const filteredPackages = useMemo(() => {
        let pkgs = PACKAGE_REGISTRY;

        if (activeCategory !== 'all') {
            pkgs = pkgs.filter((p) => p.category === activeCategory);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            pkgs = pkgs.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.category.includes(q)
            );
        }

        // Sort: popular first, then alphabetical
        return pkgs.sort((a, b) => {
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [activeCategory, search]);

    // Group by category
    const groupedPackages = useMemo(() => {
        if (activeCategory !== 'all') {
            return [{ category: activeCategory, packages: filteredPackages }];
        }

        const groups: { category: PackageCategory; packages: PackageInfo[] }[] = [];
        const categories = Array.from(new Set(filteredPackages.map((p) => p.category)));

        for (const cat of categories) {
            groups.push({
                category: cat,
                packages: filteredPackages.filter((p) => p.category === cat),
            });
        }

        return groups;
    }, [activeCategory, filteredPackages]);

    // Toggle a package
    const handleToggle = useCallback((pkg: PackageInfo) => {
        const result = togglePackage(source, pkg);
        onSourceChange(result.source);
    }, [source, onSourceChange]);

    // Count enabled per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const pkg of PACKAGE_REGISTRY) {
            if (!counts[pkg.category]) counts[pkg.category] = 0;
            if (enabledPackages.includes(pkg.name)) counts[pkg.category]++;
        }
        return counts;
    }, [enabledPackages]);

    if (!isOpen) return null;

    return (
        <div className="pkgmgr-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="pkgmgr-panel" role="dialog" aria-label="Package Manager">
                {/* ── Header ──────────────────────────────── */}
                <div className="pkgmgr-header">
                    <div className="pkgmgr-title">
                        <span>📦</span>
                        <h2>Package Manager</h2>
                        <span className="pkgmgr-count">{enabledPackages.length} active</span>
                    </div>
                    <button className="pkgmgr-close" onClick={onClose}>✕</button>
                </div>

                {/* ── Search ──────────────────────────────── */}
                <div className="pkgmgr-search">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search packages..."
                        className="pkgmgr-search-input"
                        autoFocus
                    />
                </div>

                {/* ── Category Tabs ───────────────────────── */}
                <div className="pkgmgr-categories">
                    <button
                        className={`pkgmgr-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('all')}
                    >
                        All
                    </button>
                    {(Object.keys(CATEGORY_LABELS) as PackageCategory[]).map((cat) => (
                        <button
                            key={cat}
                            className={`pkgmgr-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            <span>{CATEGORY_LABELS[cat].icon}</span>
                            <span>{CATEGORY_LABELS[cat].label}</span>
                            {(categoryCounts[cat] || 0) > 0 && (
                                <span className="pkgmgr-cat-badge">{categoryCounts[cat]}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Package Grid ────────────────────────── */}
                <div className="pkgmgr-grid">
                    {groupedPackages.map((group) => (
                        <div key={group.category} className="pkgmgr-group">
                            {activeCategory === 'all' && (
                                <h3 className="pkgmgr-group-title">
                                    {CATEGORY_LABELS[group.category].icon}{' '}
                                    {CATEGORY_LABELS[group.category].label}
                                </h3>
                            )}
                            <div className="pkgmgr-package-list">
                                {group.packages.map((pkg) => (
                                    <PackageCard
                                        key={pkg.name}
                                        pkg={pkg}
                                        enabled={enabledPackages.includes(pkg.name)}
                                        onToggle={() => handleToggle(pkg)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredPackages.length === 0 && (
                        <div className="pkgmgr-empty">
                            No packages match &ldquo;{search}&rdquo;
                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{ __html: STYLES }} />
            </div>
        </div>
    );
}

// ── Package Card ─────────────────────────────────────────────

function PackageCard({
    pkg,
    enabled,
    onToggle,
}: {
    pkg: PackageInfo;
    enabled: boolean;
    onToggle: () => void;
}) {
    const [showDetail, setShowDetail] = useState(false);

    return (
        <div className={`pkgmgr-card ${enabled ? 'enabled' : ''}`}>
            <div className="pkgmgr-card-main">
                <div className="pkgmgr-card-info">
                    <span className="pkgmgr-card-name">{pkg.name}</span>
                    {pkg.popular && <span className="pkgmgr-card-popular">★</span>}
                    <span className="pkgmgr-card-desc">{pkg.description}</span>
                </div>
                <div className="pkgmgr-card-actions">
                    {pkg.example && (
                        <button
                            className="pkgmgr-detail-btn"
                            onClick={() => setShowDetail(!showDetail)}
                            title="Show example"
                        >
                            ?
                        </button>
                    )}
                    <button
                        className={`pkgmgr-toggle ${enabled ? 'on' : 'off'}`}
                        onClick={onToggle}
                        aria-label={`${enabled ? 'Disable' : 'Enable'} ${pkg.name}`}
                    >
                        <span className="pkgmgr-toggle-knob" />
                    </button>
                </div>
            </div>

            {showDetail && pkg.example && (
                <div className="pkgmgr-card-detail">
                    <code>{pkg.example}</code>
                    {pkg.requires && pkg.requires.length > 0 && (
                        <span className="pkgmgr-card-deps">
                            Requires: {pkg.requires.join(', ')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Styles ───────────────────────────────────────────────────

const STYLES = `
.pkgmgr-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
}

.pkgmgr-panel {
    background: #1a1b26;
    border: 1px solid #2a2d3e;
    border-radius: 16px;
    width: 95vw;
    max-width: 900px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    animation: pkgSlideUp 0.2s ease;
}
@keyframes pkgSlideUp { from { transform: translateY(20px); opacity: 0; } }

.pkgmgr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid #2a2d3e;
}
.pkgmgr-title {
    display: flex;
    align-items: center;
    gap: 10px;
}
.pkgmgr-title h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #e1e2e8;
}
.pkgmgr-count {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #2a2d3e;
    color: #9ca3af;
}
.pkgmgr-close {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
}
.pkgmgr-close:hover { background: #2a2d3e; color: #e1e2e8; }

/* ── Search ──────────────────────────────────────── */
.pkgmgr-search {
    padding: 12px 24px;
    border-bottom: 1px solid #2a2d3e;
}
.pkgmgr-search-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    background: #111218;
    color: #e1e2e8;
    font-size: 14px;
    outline: none;
}
.pkgmgr-search-input:focus { border-color: #4f46e5; }

/* ── Categories ──────────────────────────────────── */
.pkgmgr-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 10px 24px;
    border-bottom: 1px solid #2a2d3e;
}
.pkgmgr-cat-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: #9ca3af;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
}
.pkgmgr-cat-btn:hover { background: #1e1f2e; color: #c7d2fe; }
.pkgmgr-cat-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }
.pkgmgr-cat-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 8px;
    background: rgba(79,70,229,0.2);
    color: #a5b4fc;
}
.pkgmgr-cat-btn.active .pkgmgr-cat-badge {
    background: rgba(255,255,255,0.2);
    color: white;
}

/* ── Package Grid ────────────────────────────────── */
.pkgmgr-grid {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;
}
.pkgmgr-group { margin-bottom: 18px; }
.pkgmgr-group-title {
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
    margin: 0 0 8px;
}
.pkgmgr-package-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.pkgmgr-empty {
    text-align: center;
    color: #6b7280;
    padding: 30px;
}

/* ── Package Card ────────────────────────────────── */
.pkgmgr-card {
    border: 1px solid #2a2d3e;
    border-radius: 10px;
    transition: all 0.15s;
}
.pkgmgr-card.enabled {
    border-color: rgba(79,70,229,0.4);
    background: rgba(79,70,229,0.05);
}
.pkgmgr-card-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    gap: 12px;
}
.pkgmgr-card-info {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    flex: 1;
    min-width: 0;
}
.pkgmgr-card-name {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: 13px;
    font-weight: 600;
    color: #e1e2e8;
}
.pkgmgr-card-popular {
    color: #f59e0b;
    font-size: 11px;
}
.pkgmgr-card-desc {
    font-size: 12px;
    color: #6b7280;
}
.pkgmgr-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.pkgmgr-detail-btn {
    width: 22px;
    height: 22px;
    border: 1px solid #3a3d4e;
    border-radius: 50%;
    background: none;
    color: #6b7280;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.pkgmgr-detail-btn:hover { border-color: #4f46e5; color: #a5b4fc; }

/* ── Toggle Switch ───────────────────────────────── */
.pkgmgr-toggle {
    position: relative;
    width: 36px;
    height: 20px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
    padding: 0;
}
.pkgmgr-toggle.off { background: #3a3d4e; }
.pkgmgr-toggle.on { background: #4f46e5; }
.pkgmgr-toggle-knob {
    position: absolute;
    top: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
}
.pkgmgr-toggle.off .pkgmgr-toggle-knob { left: 2px; }
.pkgmgr-toggle.on .pkgmgr-toggle-knob { left: 18px; }

/* ── Detail / Example ────────────────────────────── */
.pkgmgr-card-detail {
    padding: 0 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.pkgmgr-card-detail code {
    font-family: 'SF Mono','Fira Code',monospace;
    font-size: 11px;
    color: #a5f3a8;
    background: #0d0e14;
    padding: 6px 10px;
    border-radius: 6px;
    display: block;
}
.pkgmgr-card-deps {
    font-size: 10px;
    color: #6b7280;
}
`;

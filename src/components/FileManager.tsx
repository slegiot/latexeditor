"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    X,
    Upload,
    Trash2,
    Copy,
    Check,
    FileImage,
    FileText,
    File as FileIcon,
    Loader2,
    FolderOpen,
} from "lucide-react";

interface Asset {
    name: string;
    size: number;
    type: string;
    created: string;
    url: string;
}

interface FileManagerProps {
    open: boolean;
    projectId: string;
    onClose: () => void;
}

export function FileManager({ open, projectId, onClose }: FileManagerProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch assets
    const fetchAssets = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/assets?projectId=${projectId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAssets(data.assets ?? []);
        } catch (err: any) {
            setError(err.message || "Failed to load assets");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (open) fetchAssets();
    }, [open, fetchAssets]);

    // Upload handler
    const handleUpload = useCallback(async (files: FileList | File[]) => {
        if (!files.length) return;
        setUploading(true);
        setError(null);

        for (const file of Array.from(files)) {
            const form = new FormData();
            form.append("projectId", projectId);
            form.append("file", file);

            try {
                const res = await fetch("/api/assets", { method: "POST", body: form });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
            } catch (err: any) {
                setError(err.message || `Failed to upload ${file.name}`);
            }
        }

        setUploading(false);
        fetchAssets();
    }, [projectId, fetchAssets]);

    // Delete handler
    const handleDelete = useCallback(async (filename: string) => {
        try {
            const res = await fetch(
                `/api/assets?projectId=${projectId}&filename=${encodeURIComponent(filename)}`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            setAssets((prev) => prev.filter((a) => a.name !== filename));
        } catch (err: any) {
            setError(err.message || "Delete failed");
        }
    }, [projectId]);

    // Copy LaTeX snippet
    const handleCopy = useCallback((filename: string) => {
        const ext = filename.split(".").pop()?.toLowerCase() ?? "";
        const snippet = ext === "bib"
            ? `\\bibliography{${filename.replace(`.${ext}`, "")}}`
            : `\\includegraphics{${filename}}`;
        navigator.clipboard.writeText(snippet);
        setCopied(filename);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    // Drag & drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);
    const handleDragLeave = useCallback(() => setDragOver(false), []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    }, [handleUpload]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getIcon = (name: string) => {
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return FileImage;
        if (["tex", "bib"].includes(ext)) return FileText;
        return FileIcon;
    };

    if (!open) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-[340px] max-w-full flex flex-col glass border-l border-[var(--color-glass-border)] animate-slide-in z-30 bg-[var(--color-surface-50)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[var(--color-accent-400)]" />
                    <span className="text-sm font-semibold">Project Files</span>
                    <span className="text-xs text-[var(--color-surface-400)]">
                        {assets.length} file{assets.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                >
                    <X className="w-4 h-4 text-[var(--color-surface-500)]" />
                </button>
            </div>

            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mx-3 mt-3 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all text-center ${dragOver
                        ? "border-[var(--color-accent-400)] bg-[var(--color-accent-500)]/10"
                        : "border-[var(--color-glass-border)] hover:border-[var(--color-surface-400)]"
                    }`}
            >
                {uploading ? (
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--color-accent-400)]" />
                ) : (
                    <Upload className="w-6 h-6 mx-auto text-[var(--color-surface-400)]" />
                )}
                <p className="text-xs text-[var(--color-surface-500)] mt-2">
                    {uploading ? "Uploading..." : "Drop files here or click to upload"}
                </p>
                <p className="text-[10px] text-[var(--color-surface-400)] mt-1">
                    PNG, JPG, PDF, EPS, SVG, BIB — max 10MB
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.svg,.pdf,.eps,.bib"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files) handleUpload(e.target.files);
                        e.target.value = "";
                    }}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="mx-3 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {error}
                </div>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto px-3 mt-3 pb-3 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-surface-400)]" />
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-[var(--color-surface-400)]">
                        <FolderOpen className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs">No files uploaded yet</p>
                        <p className="text-[10px] mt-1">
                            Upload images to use with \includegraphics
                        </p>
                    </div>
                ) : (
                    assets.map((asset) => {
                        const Icon = getIcon(asset.name);
                        return (
                            <div
                                key={asset.name}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-glass-hover)] group transition-colors"
                            >
                                <Icon className="w-4 h-4 text-[var(--color-surface-500)] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{asset.name}</p>
                                    <p className="text-[10px] text-[var(--color-surface-400)]">
                                        {formatSize(asset.size)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCopy(asset.name)}
                                    className="p-1 rounded hover:bg-[var(--color-glass-hover)] transition-colors opacity-0 group-hover:opacity-100"
                                    title="Copy LaTeX snippet"
                                >
                                    {copied === asset.name ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-[var(--color-surface-500)]" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDelete(asset.name)}
                                    className="p-1 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete file"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

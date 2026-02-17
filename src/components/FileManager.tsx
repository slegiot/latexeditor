"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    X,
    FolderOpen,
    Upload,
    Trash2,
    Copy,
    Check,
    FileImage,
    FileText,
    Loader2,
    File,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface FileManagerProps {
    open: boolean;
    projectId: string;
    onClose: () => void;
}

interface ProjectFile {
    name: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
}

export function FileManager({ open, projectId, onClose }: FileManagerProps) {
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from("project-assets")
                .list(projectId);

            if (error) throw error;
            if (data) {
                const fileList: ProjectFile[] = data.map((f) => ({
                    name: f.name,
                    size: f.metadata?.size || 0,
                    type: f.metadata?.mimetype || "unknown",
                    url: supabase.storage
                        .from("project-assets")
                        .getPublicUrl(`${projectId}/${f.name}`).data.publicUrl,
                    created_at: f.created_at,
                }));
                setFiles(fileList);
            }
        } catch (err) {
            console.error("Error fetching files:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId, supabase]);

    useEffect(() => {
        if (open) fetchFiles();
    }, [open, fetchFiles]);

    const handleUpload = async (fileList: FileList) => {
        setUploading(true);
        try {
            for (const file of Array.from(fileList)) {
                const path = `${projectId}/${file.name}`;
                const { error } = await supabase.storage
                    .from("project-assets")
                    .upload(path, file, { upsert: true });
                if (error) throw error;
            }
            await fetchFiles();
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Delete "${fileName}"?`)) return;
        try {
            const { error } = await supabase.storage
                .from("project-assets")
                .remove([`${projectId}/${fileName}`]);
            if (error) throw error;
            setFiles((prev) => prev.filter((f) => f.name !== fileName));
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const handleCopySnippet = (file: ProjectFile) => {
        const isImage = file.type.startsWith("image/");
        const snippet = isImage
            ? `\\includegraphics{${file.name}}`
            : `\\bibliography{${file.name.replace(/\.\w+$/, "")}}`;
        navigator.clipboard.writeText(snippet);
        setCopied(file.name);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length > 0) {
                handleUpload(e.dataTransfer.files);
            }
        },
        [handleUpload]
    );

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-400" />;
        if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
        return <File className="w-4 h-4 text-surface-400" />;
    };

    if (!open) return null;

    return (
        <div
            className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-surface-800/50 flex flex-col z-30 animate-slide-in-right"
            style={{ animationDirection: "reverse", animationName: "none" }}
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/50 shrink-0">
                <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <FolderOpen className="w-4 h-4 text-accent-400" />
                    <span>Files</span>
                </div>
                <button onClick={onClose} className="btn-ghost p-1" aria-label="Close">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Upload */}
            <div className="px-3 py-3 border-b border-surface-800/50 shrink-0">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleUpload(e.target.files)}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary w-full justify-center text-xs"
                >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 icon-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? "Uploading…" : "Upload Files"}
                </button>
                <p className="text-[11px] text-surface-600 text-center mt-1.5">or drag & drop files here</p>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-accent-400 icon-spin" />
                    </div>
                ) : files.length === 0 ? (
                    <p className="text-xs text-surface-500 text-center py-8">No files yet</p>
                ) : (
                    files.map((file) => (
                        <div key={file.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-800/30 transition-colors group">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getFileIcon(file.type)}
                                <div className="min-w-0">
                                    <p className="text-xs text-surface-300 truncate">{file.name}</p>
                                    <p className="text-[10px] text-surface-600">{formatSize(file.size)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => handleCopySnippet(file)}
                                    title="Copy LaTeX snippet"
                                    className="btn-ghost p-1"
                                >
                                    {copied === file.name ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                                </button>
                                <button
                                    onClick={() => handleDelete(file.name)}
                                    title="Delete"
                                    className="btn-ghost p-1 text-danger hover:text-danger"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Drop zone overlay */}
            {dragOver && (
                <div className="absolute inset-0 bg-accent-500/10 border-2 border-dashed border-accent-400 rounded-xl flex flex-col items-center justify-center z-10">
                    <Upload className="w-8 h-8 text-accent-400 mb-2" />
                    <p className="text-sm text-accent-400 font-medium">Drop files here</p>
                </div>
            )}
        </div>
    );
}

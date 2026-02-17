"use client";

import { useState } from "react";
import {
    Folder,
    FileText,
    Image,
    FileCode,
    MoreVertical,
    Plus,
    ChevronRight,
    ChevronDown,
    Trash2,
    Edit3,
    Upload,
    X,
} from "lucide-react";

interface FileNode {
    id: string;
    name: string;
    type: "file" | "folder";
    fileType?: "tex" | "bib" | "png" | "jpg" | "pdf" | "other";
    children?: FileNode[];
    isOpen?: boolean;
}

interface FileManagerProps {
    open: boolean;
    projectId: string;
    onClose: () => void;
}

const mockFiles: FileNode[] = [
    {
        id: "1",
        name: "main.tex",
        type: "file",
        fileType: "tex",
    },
    {
        id: "2",
        name: "sections",
        type: "folder",
        isOpen: true,
        children: [
            { id: "2-1", name: "introduction.tex", type: "file", fileType: "tex" },
            { id: "2-2", name: "methods.tex", type: "file", fileType: "tex" },
            { id: "2-3", name: "results.tex", type: "file", fileType: "tex" },
            { id: "2-4", name: "conclusion.tex", type: "file", fileType: "tex" },
        ],
    },
    {
        id: "3",
        name: "references.bib",
        type: "file",
        fileType: "bib",
    },
    {
        id: "4",
        name: "figures",
        type: "folder",
        isOpen: false,
        children: [
            { id: "4-1", name: "figure1.png", type: "file", fileType: "png" },
            { id: "4-2", name: "figure2.jpg", type: "file", fileType: "jpg" },
            { id: "4-3", name: "diagram.pdf", type: "file", fileType: "pdf" },
        ],
    },
];

export function FileManager({ open, projectId, onClose }: FileManagerProps) {
    const [files, setFiles] = useState<FileNode[]>(mockFiles);
    const [activeFile, setActiveFile] = useState<string>("1");
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        fileId: string;
    } | null>(null);

    const toggleFolder = (id: string) => {
        const toggleNode = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
                if (node.id === id) {
                    return { ...node, isOpen: !node.isOpen };
                }
                if (node.children) {
                    return { ...node, children: toggleNode(node.children) };
                }
                return node;
            });
        };
        setFiles(toggleNode(files));
    };

    const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const getFileIcon = (fileType?: string) => {
        switch (fileType) {
            case "tex":
                return <FileCode className="w-4 h-4 text-emerald-400" />;
            case "bib":
                return <FileText className="w-4 h-4 text-yellow-400" />;
            case "png":
            case "jpg":
                return <Image className="w-4 h-4 text-purple-400" />;
            case "pdf":
                return <FileText className="w-4 h-4 text-red-400" />;
            default:
                return <FileText className="w-4 h-4 text-[var(--text-muted)]" />;
        }
    };

    if (!open) return null;

    return (
        <>
            {/* Mobile overlay */}
            <div
                className="fixed inset-0 bg-black/50 lg:hidden z-40"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-14 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] z-50 animate-slide-in-right lg:animate-none flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
                    <h3 className="font-semibold text-sm">Files</h3>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="New file"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Upload"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors lg:hidden"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* File Tree */}
                <div
                    className="flex-1 overflow-y-auto p-2"
                    onClick={handleCloseContextMenu}
                >
                    <FileTree
                        nodes={files}
                        activeFile={activeFile}
                        onFileClick={setActiveFile}
                        onToggleFolder={toggleFolder}
                        onContextMenu={handleContextMenu}
                        getFileIcon={getFileIcon}
                    />
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--border-secondary)] text-xs text-[var(--text-muted)]">
                    {projectId}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-50"
                        onClick={handleCloseContextMenu}
                    />
                    <div
                        className="fixed z-50 w-48 py-1 rounded-lg glass-strong border border-[var(--border-primary)] shadow-xl animate-scale-in"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <Edit3 className="w-4 h-4" />
                            Rename
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

interface FileTreeProps {
    nodes: FileNode[];
    activeFile: string;
    onFileClick: (id: string) => void;
    onToggleFolder: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, fileId: string) => void;
    getFileIcon: (fileType?: string) => React.ReactNode;
    level?: number;
}

function FileTree({
    nodes,
    activeFile,
    onFileClick,
    onToggleFolder,
    onContextMenu,
    getFileIcon,
    level = 0,
}: FileTreeProps) {
    return (
        <div className="space-y-0.5">
            {nodes.map((node) => (
                <div key={node.id}>
                    <div
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${node.type === "file" && activeFile === node.id
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            }`}
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                        onClick={() =>
                            node.type === "folder"
                                ? onToggleFolder(node.id)
                                : onFileClick(node.id)
                        }
                        onContextMenu={(e) => onContextMenu(e, node.id)}
                    >
                        {node.type === "folder" ? (
                            <>
                                {node.isOpen ? (
                                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                )}
                                <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            </>
                        ) : (
                            <>
                                <span className="w-4 flex-shrink-0" />
                                {getFileIcon(node.fileType)}
                            </>
                        )}
                        <span className="text-sm truncate flex-1">{node.name}</span>
                    </div>
                    {node.type === "folder" && node.isOpen && node.children && (
                        <FileTree
                            nodes={node.children}
                            activeFile={activeFile}
                            onFileClick={onFileClick}
                            onToggleFolder={onToggleFolder}
                            onContextMenu={onContextMenu}
                            getFileIcon={getFileIcon}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

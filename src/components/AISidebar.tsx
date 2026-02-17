"use client";

import { useState, useRef, useEffect } from "react";
import {
    X,
    Send,
    Bot,
    Sparkles,
    Wand2,
    Code2,
    Loader2,
    Check,
    Copy,
    RotateCcw,
} from "lucide-react";
import type { LatexError } from "@/lib/latex-errors";

interface AISidebarProps {
    open: boolean;
    mode: "fix" | "generate";
    errors: LatexError[];
    getContent: () => string;
    onApplyContent: (content: string) => void;
    onClose: () => void;
    onModeChange: (mode: "fix" | "generate") => void;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    type?: "text" | "code";
}

export function AISidebar({
    open,
    mode,
    errors,
    getContent,
    onApplyContent,
    onClose,
    onModeChange,
}: AISidebarProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedFix, setSuggestedFix] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Show error context when opening in fix mode
    useEffect(() => {
        if (open && mode === "fix" && errors.length > 0 && messages.length === 0) {
            const errorText = errors
                .map((e) => `Line ${e.line}: ${e.message}`)
                .join("\n");
            setMessages([
                {
                    id: "system",
                    role: "assistant",
                    content: `I found ${errors.length} error${errors.length > 1 ? "s" : ""} in your document:\n\n${errorText}\n\nWould you like me to help fix them?`,
                    type: "text",
                },
            ]);
        }
    }, [open, mode, errors]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            type: "text",
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: getContent(),
                    prompt: input,
                    mode,
                    errors,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.result,
                    type: data.type || "text",
                };
                setMessages((prev) => [...prev, assistantMessage]);

                if (data.type === "code") {
                    setSuggestedFix(data.result);
                }
            } else {
                const error = await response.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: `Error: ${error.error || "Failed to get response"}`,
                        type: "text",
                    },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                    type: "text",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFix = () => {
        if (suggestedFix) {
            onApplyContent(suggestedFix);
            setSuggestedFix(null);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "Changes applied successfully!",
                    type: "text",
                },
            ]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
            <div className="fixed right-0 top-14 bottom-0 w-96 bg-[var(--bg-secondary)] border-l border-[var(--border-secondary)] z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">AI Assistant</h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                {mode === "fix" ? "Fix Errors" : "Generate Content"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onModeChange(mode === "fix" ? "generate" : "fix")}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            title={mode === "fix" ? "Switch to Generate" : "Switch to Fix"}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors lg:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex border-b border-[var(--border-secondary)]">
                    <button
                        onClick={() => onModeChange("fix")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${mode === "fix"
                                ? "text-purple-400 bg-purple-500/10"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <Wand2 className="w-4 h-4" />
                        Fix
                    </button>
                    <button
                        onClick={() => onModeChange("generate")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${mode === "generate"
                                ? "text-purple-400 bg-purple-500/10"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">
                                {mode === "fix"
                                    ? "I can help you fix LaTeX errors in your document."
                                    : "I can help you write and improve your LaTeX document."}
                            </p>
                            <div className="mt-4 space-y-2">
                                {mode === "fix" ? (
                                    <>
                                        <SuggestionChip
                                            text="Fix all errors"
                                            onClick={() => setInput("Fix all errors in my document")}
                                        />
                                        <SuggestionChip
                                            text="Explain the errors"
                                            onClick={() => setInput("Explain these errors to me")}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <SuggestionChip
                                            text="Write an introduction"
                                            onClick={() => setInput("Write an introduction section")}
                                        />
                                        <SuggestionChip
                                            text="Improve this paragraph"
                                            onClick={() => setInput("Improve the writing in this document")}
                                        />
                                        <SuggestionChip
                                            text="Add citations"
                                            onClick={() => setInput("Add proper citations where needed")}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""
                                }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === "user"
                                        ? "bg-emerald-500/10"
                                        : "bg-purple-500/10"
                                    }`}
                            >
                                {message.role === "user" ? (
                                    <span className="text-xs font-medium text-emerald-400">
                                        You
                                    </span>
                                ) : (
                                    <Bot className="w-4 h-4 text-purple-400" />
                                )}
                            </div>
                            <div
                                className={`flex-1 rounded-lg p-3 text-sm ${message.role === "user"
                                        ? "bg-emerald-500/10 text-emerald-100"
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                    }`}
                            >
                                {message.type === "code" ? (
                                    <pre className="font-mono text-xs overflow-x-auto">
                                        <code>{message.content}</code>
                                    </pre>
                                ) : (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1 rounded-lg p-3 bg-[var(--bg-tertiary)]">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Apply Fix Button */}
                {suggestedFix && (
                    <div className="px-4 py-3 border-t border-[var(--border-secondary)] bg-purple-500/5">
                        <button
                            onClick={handleApplyFix}
                            className="w-full btn-primary justify-center"
                        >
                            <Check className="w-4 h-4" />
                            Apply Changes
                        </button>
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-[var(--border-secondary)]">
                    <div className="flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                mode === "fix"
                                    ? "Ask me to fix something..."
                                    : "Ask me to write something..."
                            }
                            rows={1}
                            className="flex-1 input-field resize-none min-h-[40px] max-h-[120px]"
                            style={{ height: "auto" }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="btn-primary"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </div>
        </>
    );
}

function SuggestionChip({
    text,
    onClick,
}: {
    text: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="text-sm px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border-secondary)]"
        >
            {text}
        </button>
    );
}

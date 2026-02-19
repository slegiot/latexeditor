// ─────────────────────────────────────────────────────────────
// LaTeXForge — Monaco AI Inline Completion Provider
// ─────────────────────────────────────────────────────────────
// Registers a Monaco InlineCompletionItemProvider that calls
// the AI completion endpoint to provide ghost-text suggestions.
//
// Triggered on pause (debounced) — shows grey ghost text that
// the user can accept with Tab.
//
// Premium-only: if the user is on a free plan, the provider
// silently returns no suggestions.
// ─────────────────────────────────────────────────────────────

import type * as Monaco from 'monaco-editor';

const DEBOUNCE_MS = 600; // Wait 600ms after typing stops before requesting
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let abortController: AbortController | null = null;

/**
 * Register the AI inline completion provider with a Monaco editor instance.
 * Returns a disposable to clean up the provider.
 */
export function registerAICompletionProvider(
    monaco: typeof Monaco,
    editor: Monaco.editor.IStandaloneCodeEditor,
    options: { enabled: boolean }
): Monaco.IDisposable {
    const provider: Monaco.languages.InlineCompletionsProvider = {
        provideInlineCompletions: async (
            model: Monaco.editor.ITextModel,
            position: Monaco.Position,
            _context: Monaco.languages.InlineCompletionContext,
            token: Monaco.CancellationToken
        ): Promise<Monaco.languages.InlineCompletions> => {
            if (!options.enabled) {
                return { items: [] };
            }

            // Cancel any previous pending request
            clearTimeout(debounceTimer);
            if (abortController) {
                abortController.abort();
            }

            // Wait for typing pause (debounce)
            const shouldProceed = await new Promise<boolean>((resolve) => {
                debounceTimer = setTimeout(() => resolve(true), DEBOUNCE_MS);
                token.onCancellationRequested(() => {
                    clearTimeout(debounceTimer);
                    resolve(false);
                });
            });

            if (!shouldProceed || token.isCancellationRequested) {
                return { items: [] };
            }

            // Extract context around cursor
            const fullText = model.getValue();
            const offset = model.getOffsetAt(position);
            const prefix = fullText.slice(0, offset);
            const suffix = fullText.slice(offset);

            // Don't complete if we're in a comment line
            const currentLine = model.getLineContent(position.lineNumber);
            if (currentLine.trimStart().startsWith('%')) {
                return { items: [] };
            }

            // Don't complete if prefix is too short (less than 20 chars of content)
            const meaningfulContent = prefix.replace(/\s+/g, '');
            if (meaningfulContent.length < 20) {
                return { items: [] };
            }

            try {
                abortController = new AbortController();

                const res = await fetch('/api/ai/assist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'complete',
                        prefix,
                        suffix,
                    }),
                    signal: abortController.signal,
                });

                if (!res.ok) {
                    return { items: [] };
                }

                const data = await res.json();
                const text = data.text;

                if (!text || token.isCancellationRequested) {
                    return { items: [] };
                }

                return {
                    items: [
                        {
                            insertText: text,
                            range: new monaco.Range(
                                position.lineNumber,
                                position.column,
                                position.lineNumber,
                                position.column
                            ),
                        },
                    ],
                };
            } catch {
                return { items: [] };
            } finally {
                abortController = null;
            }
        },

        freeInlineCompletions: () => {
            // No cleanup needed
        },
    };

    return monaco.languages.registerInlineCompletionsProvider('latex', provider);
}

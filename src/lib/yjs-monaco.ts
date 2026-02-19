// ─────────────────────────────────────────────────────────────
// LaTeXForge — Yjs ↔ Monaco Binding
// ─────────────────────────────────────────────────────────────
// Bridges the Hocuspocus Yjs provider with Monaco editor.
//   - Syncs Y.Text ↔ Monaco model content (both directions)
//   - Renders remote cursor decorations (colored, labeled)
//   - Propagates local cursor/selection to awareness
// ─────────────────────────────────────────────────────────────

import * as Y from 'yjs';
import type * as Monaco from 'monaco-editor';
import type { CollaborationInstance, AwarenessState } from './collaboration';

/**
 * Bind a Yjs Y.Text to a Monaco editor model.
 * Returns a cleanup function.
 */
export function bindYjsToMonaco(
    collab: CollaborationInstance,
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
): () => void {
    const yText = collab.text;
    const editorModel = editor.getModel()!;
    if (!editorModel) throw new Error('Monaco editor has no model');

    let isApplyingRemoteChange = false;
    const decorationIds: string[] = [];

    // ── 1. Initial sync: Yjs → Monaco ──────────────────────────
    const initialContent = yText.toString();
    if (initialContent && editorModel.getValue() !== initialContent) {
        editorModel.setValue(initialContent);
    }

    // ── 2. Yjs → Monaco (remote changes) ──────────────────────
    function onYjsUpdate(event: Y.YTextEvent): void {
        if (isApplyingRemoteChange) return;

        isApplyingRemoteChange = true;
        try {
            const edits: Monaco.editor.IIdentifiedSingleEditOperation[] = [];
            let offset = 0;

            for (const delta of event.delta) {
                if (delta.retain !== undefined) {
                    offset += delta.retain;
                } else if (delta.insert !== undefined) {
                    const insertText = typeof delta.insert === 'string' ? delta.insert : '';
                    const pos = editorModel.getPositionAt(offset);
                    edits.push({
                        range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                        text: insertText,
                        forceMoveMarkers: true,
                    });
                    offset += insertText.length;
                } else if (delta.delete !== undefined) {
                    const startPos = editorModel.getPositionAt(offset);
                    const endPos = editorModel.getPositionAt(offset + delta.delete);
                    edits.push({
                        range: new monaco.Range(
                            startPos.lineNumber, startPos.column,
                            endPos.lineNumber, endPos.column
                        ),
                        text: '',
                        forceMoveMarkers: true,
                    });
                }
            }

            if (edits.length > 0) {
                editor.executeEdits('yjs-remote', edits);
            }
        } finally {
            isApplyingRemoteChange = false;
        }
    }

    yText.observe(onYjsUpdate);

    // ── 3. Monaco → Yjs (local changes) ───────────────────────
    const contentChangeDisposable = editor.onDidChangeModelContent((e) => {
        if (isApplyingRemoteChange) return;

        isApplyingRemoteChange = true;
        try {
            collab.doc.transact(() => {
                // Apply changes in reverse order to maintain correct offsets
                const sortedChanges = [...e.changes].sort(
                    (a, b) => b.rangeOffset - a.rangeOffset
                );

                for (const change of sortedChanges) {
                    if (change.rangeLength > 0) {
                        yText.delete(change.rangeOffset, change.rangeLength);
                    }
                    if (change.text) {
                        yText.insert(change.rangeOffset, change.text);
                    }
                }
            });
        } finally {
            isApplyingRemoteChange = false;
        }

        // Update typing indicator
        collab.setTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => collab.setTyping(false), 1500);
    });

    let typingTimeout: ReturnType<typeof setTimeout> | undefined;

    // ── 4. Local cursor → Awareness ────────────────────────────
    const cursorChangeDisposable = editor.onDidChangeCursorPosition((e) => {
        const offset = editorModel.getOffsetAt(e.position);
        collab.updateCursor(offset, offset);
    });

    const selectionChangeDisposable = editor.onDidChangeCursorSelection((e) => {
        const from = editorModel.getOffsetAt(e.selection.getStartPosition());
        const to = editorModel.getOffsetAt(e.selection.getEndPosition());
        if (from !== to) {
            collab.updateSelection(from, to);
        }
    });

    // ── 5. Remote awareness → Cursor decorations ──────────────
    function renderRemoteCursors(): void {
        const states = collab.provider.awareness?.getStates();
        if (!states) return;

        const newDecorations: Monaco.editor.IModelDeltaDecoration[] = [];

        states.forEach((state: Record<string, unknown>, clientId: number) => {
            // Skip our own client
            if (clientId === collab.provider.awareness?.clientID) return;

            const awarenessState = state as unknown as AwarenessState;
            if (!awarenessState.user) return;

            const { user, cursor, selection } = awarenessState;

            // Remote cursor line
            if (cursor && cursor.anchor != null) {
                const pos = editorModel.getPositionAt(cursor.anchor);
                newDecorations.push({
                    range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column + 1),
                    options: {
                        className: `remote-cursor remote-cursor-${clientId}`,
                        beforeContentClassName: `remote-cursor-widget`,
                        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                        hoverMessage: { value: `**${user.name}**` },
                    },
                });
            }

            // Remote selection highlight
            if (selection && selection.from !== selection.to) {
                const startPos = editorModel.getPositionAt(selection.from);
                const endPos = editorModel.getPositionAt(selection.to);
                newDecorations.push({
                    range: new monaco.Range(
                        startPos.lineNumber, startPos.column,
                        endPos.lineNumber, endPos.column
                    ),
                    options: {
                        className: `remote-selection remote-selection-${clientId}`,
                        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                    },
                });
            }

            // Inject dynamic CSS for this user's color
            injectUserCursorStyles(clientId, user.color, user.colorLight);
        });

        // Apply decorations (delta update)
        const newIds = editor.deltaDecorations(decorationIds, newDecorations);
        decorationIds.length = 0;
        decorationIds.push(...newIds);
    }

    // Update cursors on awareness changes
    const awarenessInterval = setInterval(renderRemoteCursors, 100);

    // ── 6. Cleanup ─────────────────────────────────────────────
    return () => {
        yText.unobserve(onYjsUpdate);
        contentChangeDisposable.dispose();
        cursorChangeDisposable.dispose();
        selectionChangeDisposable.dispose();
        clearInterval(awarenessInterval);
        clearTimeout(typingTimeout);
        editor.deltaDecorations(decorationIds, []);
    };
}

// ── Dynamic CSS for remote cursor colors ─────────────────────

const injectedStyles = new Set<number>();

function injectUserCursorStyles(clientId: number, color: string, colorLight: string): void {
    if (injectedStyles.has(clientId)) return;
    injectedStyles.add(clientId);

    const style = document.createElement('style');
    style.textContent = `
    .remote-cursor-${clientId} {
      border-left: 2px solid ${color};
      position: relative;
    }
    .remote-cursor-${clientId}::after {
      content: '';
      position: absolute;
      top: 0;
      left: -2px;
      width: 6px;
      height: 6px;
      background: ${color};
      border-radius: 50%;
    }
    .remote-selection-${clientId} {
      background-color: ${colorLight || color}30;
    }
  `;
    document.head.appendChild(style);
}

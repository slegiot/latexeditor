// ─────────────────────────────────────────────────────────────
// LaTeXForge — Hocuspocus Client Provider
// ─────────────────────────────────────────────────────────────
// Client-side collaboration provider using @hocuspocus/provider.
// Connects to the Hocuspocus WebSocket server with:
//   - JWT authentication (Supabase access token)
//   - User awareness (cursor position, selection, name, color)
//   - Automatic reconnection with backoff
//
// Each project file gets its own Yjs Doc + room. The room name
// format is "latexforge:{projectId}:{filePath}".
// ─────────────────────────────────────────────────────────────

import * as Y from 'yjs';
import { HocuspocusProvider, HocuspocusProviderConfiguration } from '@hocuspocus/provider';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT || 4444}`;

// ── Types ────────────────────────────────────────────────────

export interface AwarenessUser {
    id: string;
    name: string;
    color: string;
    colorLight: string;
}

export interface AwarenessState {
    user: AwarenessUser;
    cursor: {
        anchor: number;
        head: number;
    } | null;
    selection: {
        from: number;
        to: number;
    } | null;
    typing: boolean;
    lastActive: number;
}

export interface CollaborationOptions {
    projectId: string;
    filePath: string;
    userId: string;
    userName: string;
    userColor?: string;
    token: string;         // Supabase access_token for auth
    onSynced?: () => void;
    onDisconnect?: () => void;
    onAuthFailed?: (reason: string) => void;
    onAwarenessUpdate?: (states: Map<number, AwarenessState>) => void;
}

export interface CollaborationInstance {
    doc: Y.Doc;
    provider: HocuspocusProvider;
    text: Y.Text;
    awareness: HocuspocusProvider['awareness'];
    updateCursor: (anchor: number, head: number) => void;
    updateSelection: (from: number, to: number) => void;
    setTyping: (typing: boolean) => void;
    getConnectedUsers: () => AwarenessUser[];
    destroy: () => void;
}

// ── Provider Factory ─────────────────────────────────────────

/**
 * Creates a Hocuspocus collaboration session for a specific project file.
 *
 * Usage with CodeMirror:
 * ```ts
 * const collab = createCollaboration({
 *   projectId: 'abc-123',
 *   filePath: 'main.tex',
 *   userId: user.id,
 *   userName: 'Alice',
 *   token: session.access_token,
 * });
 *
 * // Bind to CodeMirror via y-codemirror.next
 * import { yCollab } from 'y-codemirror.next';
 * const extension = yCollab(collab.text, collab.awareness);
 *
 * // Update cursor on editor state change
 * collab.updateCursor(anchorPos, headPos);
 *
 * // Cleanup on unmount
 * collab.destroy();
 * ```
 */
export function createCollaboration(options: CollaborationOptions): CollaborationInstance {
    const {
        projectId,
        filePath,
        userId,
        userName,
        token,
        onSynced,
        onDisconnect,
        onAuthFailed,
        onAwarenessUpdate,
    } = options;

    const userColor = options.userColor || getUserColor(userId);
    const colorLight = getUserColorLight(userId);

    // Room name uniquely identifies a per-file collaborative document
    const documentName = `latexforge:${projectId}:${filePath}`;

    // Create a fresh Yjs document
    const doc = new Y.Doc();

    // ── Hocuspocus Provider ──────────────────────────────────────

    const providerConfig: HocuspocusProviderConfiguration = {
        url: WS_URL,
        name: documentName,
        document: doc,
        token,   // Sent to server for onAuthenticate

        // Connection parameters (available in server hooks)
        parameters: {
            projectId,
            filePath,
        },

        // Reconnection
        connect: true,
        preserveConnection: true,

        // Event handlers
        onSynced: () => {
            console.log(`[Collab] Synced: "${filePath}"`);
            onSynced?.();
        },

        onClose: () => {
            console.log(`[Collab] Disconnected from "${filePath}"`);
            onDisconnect?.();
        },

        onAuthenticationFailed: ({ reason }: { reason: string }) => {
            console.error(`[Collab] Auth failed for "${filePath}": ${reason}`);
            onAuthFailed?.(reason);
        },

        // Awareness update handler
        onAwarenessUpdate: ({ states }: { states: unknown }) => {
            onAwarenessUpdate?.(states as Map<number, AwarenessState>);
        },
    };

    const provider = new HocuspocusProvider(providerConfig);

    // ── Set Initial Awareness State ──────────────────────────────

    provider.setAwarenessField('user', {
        id: userId,
        name: userName,
        color: userColor,
        colorLight,
    } satisfies AwarenessUser);

    provider.setAwarenessField('cursor', null);
    provider.setAwarenessField('selection', null);
    provider.setAwarenessField('typing', false);
    provider.setAwarenessField('lastActive', Date.now());

    // ── Shared Text ──────────────────────────────────────────────
    const text = doc.getText('content');

    // ── Awareness Helpers ────────────────────────────────────────

    function updateCursor(anchor: number, head: number): void {
        provider.setAwarenessField('cursor', { anchor, head });
        provider.setAwarenessField('lastActive', Date.now());
    }

    function updateSelection(from: number, to: number): void {
        provider.setAwarenessField('selection', { from, to });
        provider.setAwarenessField('lastActive', Date.now());
    }

    function setTyping(typing: boolean): void {
        provider.setAwarenessField('typing', typing);
        if (typing) {
            provider.setAwarenessField('lastActive', Date.now());
        }
    }

    function getConnectedUsers(): AwarenessUser[] {
        const states = provider.awareness?.getStates();
        if (!states) return [];

        const users: AwarenessUser[] = [];
        states.forEach((state: Record<string, unknown>) => {
            if (state.user && (state.user as AwarenessUser).id !== userId) {
                users.push(state.user as AwarenessUser);
            }
        });
        return users;
    }

    // ── Cleanup ──────────────────────────────────────────────────

    function destroy(): void {
        provider.setAwarenessField('cursor', null);
        provider.setAwarenessField('selection', null);
        provider.disconnect();
        provider.destroy();
        doc.destroy();
    }

    return {
        doc,
        provider,
        text,
        awareness: provider.awareness!,
        updateCursor,
        updateSelection,
        setTyping,
        getConnectedUsers,
        destroy,
    };
}

// ── Color Utilities ──────────────────────────────────────────

/**
 * Generate a consistent color for a user based on their ID.
 * Uses HSL for visually distinct, readable colors.
 */
export function getUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Generate a lighter variant for selection highlights.
 */
export function getUserColorLight(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 90%)`;
}

/**
 * Predefined palette for the first N users (more visually curated).
 */
export const AWARENESS_COLORS = [
    { color: '#FF6B6B', light: '#FFE3E3' },  // Red
    { color: '#4ECDC4', light: '#D5F5F2' },  // Teal
    { color: '#FFE66D', light: '#FFF9DB' },  // Yellow
    { color: '#6C5CE7', light: '#E2DEFF' },  // Purple
    { color: '#FD79A8', light: '#FFE0EB' },  // Pink
    { color: '#00B894', light: '#D1FAE5' },  // Green
    { color: '#FDCB6E', light: '#FFF3CD' },  // Amber
    { color: '#0984E3', light: '#DBEAFE' },  // Blue
] as const;

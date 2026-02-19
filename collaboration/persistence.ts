// ─────────────────────────────────────────────────────────────
// LaTeXForge — Hocuspocus Supabase Persistence Extension
// ─────────────────────────────────────────────────────────────
// Loads Yjs document state from Supabase on room open, and
// persists updates back on debounced save or disconnect.
//
// Document state is stored as BYTEA in the yjs_documents table.
// On first load for a new file, we bootstrap from the
// project_files.content column (the source-of-truth for files
// that haven't been collaboratively edited yet).
// ─────────────────────────────────────────────────────────────

import { Extension, onLoadDocumentPayload, onStoreDocumentPayload, onDisconnectPayload } from '@hocuspocus/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as Y from 'yjs';

// Service-role client for server-side DB access
function getSupabaseAdmin(): SupabaseClient {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

/**
 * Parse a Hocuspocus document name into project ID and file path.
 * Format: "latexforge:{projectId}:{filePath}"
 */
function parseDocumentName(name: string): { projectId: string; filePath: string } | null {
    const parts = name.split(':');
    if (parts.length < 3 || parts[0] !== 'latexforge') return null;
    return {
        projectId: parts[1],
        filePath: parts.slice(2).join(':'), // Handle colons in file paths
    };
}

/**
 * Creates the Supabase persistence extension for Hocuspocus.
 *
 * Lifecycle:
 * 1. onLoadDocument — loads persisted Yjs state (or bootstraps from project_files)
 * 2. onStoreDocument — saves Yjs state on debounced interval
 * 3. onDisconnect — final save when last user leaves
 */
export function createSupabasePersistence(): Extension {
    const supabase = getSupabaseAdmin();

    return {
        // ── Load Document ──────────────────────────────────────────
        async onLoadDocument(data: onLoadDocumentPayload): Promise<Y.Doc> {
            const parsed = parseDocumentName(data.documentName);
            if (!parsed) return data.document;

            const { projectId, filePath } = parsed;

            console.log(`[Persistence] Loading "${filePath}" for project ${projectId}`);

            // Try to load persisted Yjs state
            const { data: yjsDoc, error } = await supabase
                .from('yjs_documents')
                .select('state')
                .eq('document_name', data.documentName)
                .single();

            if (yjsDoc?.state) {
                // Apply persisted binary state to the document
                const update = Buffer.from(yjsDoc.state, 'base64');
                Y.applyUpdate(data.document, new Uint8Array(update));
                console.log(`[Persistence] Loaded persisted state for "${filePath}" (${update.length} bytes)`);
                return data.document;
            }

            // ── Bootstrap: no persisted state yet ──────────────────────
            // Load the source text from project_files and initialize the doc.
            // This happens the first time a file is opened for collaboration.
            console.log(`[Persistence] No persisted state, bootstrapping from project_files`);

            const { data: file, error: fileError } = await supabase
                .from('project_files')
                .select('content')
                .eq('project_id', projectId)
                .eq('path', filePath)
                .single();

            if (file?.content) {
                const text = data.document.getText('content');
                text.insert(0, file.content);
                console.log(`[Persistence] Bootstrapped "${filePath}" (${file.content.length} chars)`);
            }

            return data.document;
        },

        // ── Store Document ─────────────────────────────────────────
        async onStoreDocument(data: onStoreDocumentPayload): Promise<void> {
            const parsed = parseDocumentName(data.documentName);
            if (!parsed) return;

            const { projectId, filePath } = parsed;

            // Encode the full document state
            const state = Buffer.from(Y.encodeStateAsUpdate(data.document)).toString('base64');
            const stateVector = Buffer.from(Y.encodeStateVector(data.document)).toString('base64');

            // Extract plain text for the project_files table
            const text = data.document.getText('content');
            const plainContent = text.toJSON();

            // Upsert Yjs document state
            const { error: yjsError } = await supabase
                .from('yjs_documents')
                .upsert(
                    {
                        document_name: data.documentName,
                        project_id: projectId,
                        file_path: filePath,
                        state,
                        state_vector: stateVector,
                        last_saved_at: new Date().toISOString(),
                    },
                    { onConflict: 'document_name' }
                );

            if (yjsError) {
                console.error(`[Persistence] Failed to save Yjs state: ${yjsError.message}`);
                return;
            }

            // Sync plain text back to project_files (so compilations always
            // have the latest content without needing to decode Yjs state)
            const { error: fileError } = await supabase
                .from('project_files')
                .update({ content: plainContent })
                .eq('project_id', projectId)
                .eq('path', filePath);

            if (fileError) {
                console.error(`[Persistence] Failed to sync project_files: ${fileError.message}`);
            }

            console.log(
                `[Persistence] Saved "${filePath}" — ` +
                `Yjs: ${state.length} bytes, text: ${plainContent.length} chars`
            );
        },

        // ── Disconnect ─────────────────────────────────────────────
        // Log disconnection for audit trail
        async onDisconnect(data: onDisconnectPayload): Promise<void> {
            const userId = data.context?.userId;
            if (!userId) return;

            await supabase
                .from('collaboration_sessions')
                .update({ disconnected_at: new Date().toISOString() })
                .eq('document_name', data.documentName)
                .eq('user_id', userId)
                .is('disconnected_at', null);
        },
    };
}

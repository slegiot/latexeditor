// ─────────────────────────────────────────────────────────────
// LaTeXForge — Hocuspocus Authentication Extension
// ─────────────────────────────────────────────────────────────
// Verifies Supabase JWT tokens on WebSocket connection.
// Ensures only authenticated project members can join rooms.
// ─────────────────────────────────────────────────────────────

import { Extension, onAuthenticatePayload } from '@hocuspocus/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Parse a document name to extract project ID.
 * Format: "latexforge:{projectId}:{filePath}"
 */
function getProjectIdFromDocument(documentName: string): string | null {
    const parts = documentName.split(':');
    if (parts.length < 3 || parts[0] !== 'latexforge') return null;
    return parts[1];
}

/**
 * Creates the Supabase authentication extension for Hocuspocus.
 *
 * The client sends a JWT token in the connection params.
 * We verify it against Supabase Auth, then check project membership.
 */
export function createAuthExtension(): Extension {
    return {
        async onAuthenticate(data: onAuthenticatePayload): Promise<void> {
            const { token, documentName } = data;

            // ── 1. Verify JWT token ──────────────────────────────────
            if (!token) {
                throw new Error('Authentication required: no token provided');
            }

            // Use Supabase to verify the token and get the user
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !user) {
                throw new Error(`Authentication failed: ${authError?.message || 'invalid token'}`);
            }

            // ── 2. Check project membership ──────────────────────────
            const projectId = getProjectIdFromDocument(documentName);

            if (!projectId) {
                throw new Error(`Invalid document name: "${documentName}"`);
            }

            // Check if user is owner or collaborator
            const { data: project, error: projectError } = await supabaseAdmin
                .from('projects')
                .select('id, owner_id')
                .eq('id', projectId)
                .single();

            if (projectError || !project) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const isOwner = project.owner_id === user.id;

            if (!isOwner) {
                // Check collaborator table
                const { data: collab, error: collabError } = await supabaseAdmin
                    .from('collaborators')
                    .select('id, role')
                    .eq('project_id', projectId)
                    .eq('user_id', user.id)
                    .single();

                if (collabError || !collab) {
                    throw new Error('Access denied: not a project member');
                }

                // Viewers can connect (read-only awareness) but get read-only context
                data.context = {
                    userId: user.id,
                    userName: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                    email: user.email,
                    role: collab.role,
                    readOnly: collab.role === 'viewer',
                };

                console.log(
                    `[Auth] Collaborator ${user.email} (${collab.role}) ` +
                    `authenticated for project ${projectId}`
                );
                return;
            }

            // Owner — full access
            data.context = {
                userId: user.id,
                userName: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                email: user.email,
                role: 'owner',
                readOnly: false,
            };

            // ── 3. Record session ────────────────────────────────────
            await supabaseAdmin
                .from('collaboration_sessions')
                .insert({
                    document_name: documentName,
                    user_id: user.id,
                });

            console.log(
                `[Auth] Owner ${user.email} authenticated for project ${projectId}`
            );
        },
    };
}

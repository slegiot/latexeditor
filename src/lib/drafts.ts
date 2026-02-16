import { get, set, del } from "idb-keyval";

export interface Draft {
    projectId: string;
    content: string;
    savedAt: number;
}

const DRAFT_PREFIX = "latexforge-draft-";

function key(projectId: string) {
    return `${DRAFT_PREFIX}${projectId}`;
}

export async function saveDraft(
    projectId: string,
    content: string
): Promise<void> {
    const draft: Draft = {
        projectId,
        content,
        savedAt: Date.now(),
    };
    await set(key(projectId), draft);
}

export async function getDraft(
    projectId: string
): Promise<Draft | undefined> {
    return await get<Draft>(key(projectId));
}

export async function deleteDraft(projectId: string): Promise<void> {
    await del(key(projectId));
}

/**
 * Creates a debounced auto-save function.
 * Call the returned function on every keystroke — it will
 * only persist to IndexedDB after `delayMs` of inactivity.
 */
export function createAutoSave(projectId: string, delayMs = 2000) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (content: string) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            saveDraft(projectId, content);
        }, delayMs);
    };
}

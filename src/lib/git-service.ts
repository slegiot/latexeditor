/**
 * Server-side Git operations using isomorphic-git + Node.js fs.
 * Repos are stored in /tmp/latexforge-git/{projectId}/
 */

import git from "isomorphic-git";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const http = require("isomorphic-git/http/node");
import fs from "fs";
import path from "path";

const GIT_ROOT = "/tmp/latexforge-git";

function repoDir(projectId: string): string {
    return path.join(GIT_ROOT, projectId);
}

/**
 * Clone a GitHub repo (shallow) into the project's local directory.
 */
export async function cloneRepo(
    projectId: string,
    repoUrl: string,
    token: string
): Promise<{ success: boolean; message: string }> {
    const dir = repoDir(projectId);

    // Clean any existing clone
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });

    try {
        await git.clone({
            fs,
            http,
            dir,
            url: repoUrl,
            depth: 50,
            singleBranch: true,
            onAuth: () => ({ username: "x-access-token", password: token }),
        });

        return { success: true, message: `Cloned ${repoUrl}` };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Clone failed";
        return { success: false, message: msg };
    }
}

/**
 * Pull latest changes from remote.
 */
export async function pullRepo(
    projectId: string,
    token: string
): Promise<{ success: boolean; message: string }> {
    const dir = repoDir(projectId);

    if (!fs.existsSync(path.join(dir, ".git"))) {
        return { success: false, message: "No repo cloned. Clone first." };
    }

    try {
        await git.fetch({
            fs,
            http,
            dir,
            onAuth: () => ({ username: "x-access-token", password: token }),
        });

        await git.merge({
            fs,
            dir,
            ours: await git.currentBranch({ fs, dir }) || "main",
            theirs: "remotes/origin/" + (await git.currentBranch({ fs, dir }) || "main"),
            author: { name: "LatexForge", email: "bot@latexforge.dev" },
        });

        return { success: true, message: "Pulled latest changes" };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Pull failed";
        return { success: false, message: msg };
    }
}

/**
 * Write content to main.tex, commit, and push.
 */
export async function pushRepo(
    projectId: string,
    token: string,
    content: string,
    commitMessage: string,
    author: { name: string; email: string }
): Promise<{ success: boolean; message: string }> {
    const dir = repoDir(projectId);

    if (!fs.existsSync(path.join(dir, ".git"))) {
        return { success: false, message: "No repo cloned. Clone first." };
    }

    try {
        // Write the file
        const texPath = path.join(dir, "main.tex");
        fs.writeFileSync(texPath, content, "utf-8");

        // Stage
        await git.add({ fs, dir, filepath: "main.tex" });

        // Commit
        await git.commit({
            fs,
            dir,
            message: commitMessage || "Update from LatexForge",
            author: {
                name: author.name,
                email: author.email,
            },
        });

        // Push
        await git.push({
            fs,
            http,
            dir,
            onAuth: () => ({ username: "x-access-token", password: token }),
        });

        return { success: true, message: "Pushed to GitHub" };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Push failed";
        return { success: false, message: msg };
    }
}

/**
 * Get commit log (most recent 50).
 */
export async function getLog(
    projectId: string
): Promise<{
    success: boolean;
    commits: Array<{
        oid: string;
        message: string;
        author: { name: string; email: string; timestamp: number };
    }>;
}> {
    const dir = repoDir(projectId);

    if (!fs.existsSync(path.join(dir, ".git"))) {
        return { success: false, commits: [] };
    }

    try {
        const log = await git.log({ fs, dir, depth: 50 });
        return {
            success: true,
            commits: log.map((entry) => ({
                oid: entry.oid.slice(0, 7),
                message: entry.commit.message,
                author: {
                    name: entry.commit.author.name,
                    email: entry.commit.author.email,
                    timestamp: entry.commit.author.timestamp,
                },
            })),
        };
    } catch {
        return { success: false, commits: [] };
    }
}

/**
 * Get working tree status.
 */
export async function getStatus(
    projectId: string
): Promise<{ success: boolean; files: Array<{ filepath: string; status: string }> }> {
    const dir = repoDir(projectId);

    if (!fs.existsSync(path.join(dir, ".git"))) {
        return { success: false, files: [] };
    }

    try {
        const matrix = await git.statusMatrix({ fs, dir });
        const files = matrix
            .filter(([, head, workdir, stage]) => head !== 1 || workdir !== 1 || stage !== 1)
            .map(([filepath, head, workdir]) => ({
                filepath: filepath as string,
                status:
                    head === 0 && workdir === 2
                        ? "added"
                        : head === 1 && workdir === 0
                            ? "deleted"
                            : head === 1 && workdir === 2
                                ? "modified"
                                : "unknown",
            }));

        return { success: true, files };
    } catch {
        return { success: false, files: [] };
    }
}

/**
 * Read main.tex from the cloned repo.
 */
export async function readRepoFile(
    projectId: string,
    filepath: string = "main.tex"
): Promise<string | null> {
    const dir = repoDir(projectId);
    const fullPath = path.join(dir, filepath);

    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, "utf-8");
    }
    return null;
}

/**
 * Clean up cloned repo.
 */
export function cleanupRepo(projectId: string): void {
    const dir = repoDir(projectId);
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

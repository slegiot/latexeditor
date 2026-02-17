import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { parseLatexLog } from "@/lib/latex-errors";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getUserLimits, type PlanLimits } from "@/lib/plan-limits";

// Store compiled PDFs in /tmp so they survive within the request lifecycle
const COMPILE_DIR = "/tmp/latexforge";

export async function POST(request: NextRequest) {
    // Rate limit: 10 compiles per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "unknown";
    console.info("[compile] request received", { ip });
    const rl = rateLimit(`compile:${ip}`, 10, 60_000);
    if (!rl.allowed) {
        console.warn("[compile] rate limited", { ip, resetMs: rl.resetMs });
        return NextResponse.json(
            { error: "Too many compilations. Please wait before trying again." },
            {
                status: 429,
                headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
            }
        );
    }

    // Get plan-based compile timeout
    let planLimits: PlanLimits | null = null;
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            planLimits = await getUserLimits(user.id);
        }
    } catch {
        // Auth check is best-effort for compile
    }
    const compileTimeout = planLimits?.compileTimeoutMs ?? 60_000;
    console.info("[compile] plan limits resolved", {
        hasUser: Boolean(planLimits),
        compileTimeout,
    });

    try {
        const { content, projectId } = await request.json();
        console.info("[compile] payload received", {
            hasContent: typeof content === "string",
            contentLength: typeof content === "string" ? content.length : 0,
            hasProjectId: Boolean(projectId),
        });

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Missing content" },
                { status: 400 }
            );
        }

        // Create a unique job directory
        const jobId = randomUUID();
        const jobDir = path.join(COMPILE_DIR, jobId);
        mkdirSync(jobDir, { recursive: true });

        const texFile = path.join(jobDir, "document.tex");
        const outputDir = path.join(jobDir, "output");
        mkdirSync(outputDir, { recursive: true });

        // Write the .tex file
        writeFileSync(texFile, content, "utf-8");
        console.info("[compile] job initialized", {
            jobId,
            jobDir,
            outputDir,
        });

        // Download project assets into the job directory so \includegraphics works
        if (projectId) {
            try {
                const assetSupabase = await createClient();
                const { data: files } = await assetSupabase.storage
                    .from("project-assets")
                    .list(projectId, { limit: 100 });

                for (const file of files ?? []) {
                    if (file.name === ".emptyFolderPlaceholder") continue;
                    const { data } = await assetSupabase.storage
                        .from("project-assets")
                        .download(`${projectId}/${file.name}`);
                    if (data) {
                        const buf = Buffer.from(await data.arrayBuffer());
                        writeFileSync(path.join(jobDir, file.name), buf);
                    }
                }
                console.info("[compile] assets downloaded", { projectId });
            } catch (assetErr) {
                console.warn("[compile] failed to download assets", assetErr);
                // Non-blocking — compile anyway
            }
        }

        let log = "";
        let pdfGenerated = false;

        try {
            console.info("[compile] compiling with pdflatex", { jobId });
            log = execSync(
                `pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFile}" 2>&1`,
                {
                    timeout: compileTimeout,
                    encoding: "utf-8",
                }
            );

            // Second pass for references / TOC
            try {
                console.info("[compile] second pass", { jobId });
                log += "\n" + execSync(
                    `pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFile}" 2>&1`,
                    {
                        timeout: compileTimeout,
                        encoding: "utf-8",
                    }
                );
            } catch {
                // Second pass failure is non-critical
            }
        } catch (compileError: unknown) {
            console.error("[compile] pdflatex failed", { jobId });
            if (compileError && typeof compileError === "object" && "stdout" in compileError) {
                log = (compileError as { stdout: string }).stdout || "";
            }
            if (compileError && typeof compileError === "object" && "stderr" in compileError) {
                log += "\n" + ((compileError as { stderr: string }).stderr || "");
            }
        }

        // Check if PDF was generated
        const pdfPath = path.join(outputDir, "document.pdf");
        if (existsSync(pdfPath)) {
            pdfGenerated = true;
        }
        console.info("[compile] pdf detection", {
            jobId,
            pdfGenerated,
            pdfPath,
        });

        // Parse errors from the log
        const errors = parseLatexLog(log);

        if (pdfGenerated) {
            // Copy PDF to the job dir for serving
            const servePath = path.join(COMPILE_DIR, `${jobId}.pdf`);
            const pdfBuffer = readFileSync(pdfPath);
            writeFileSync(servePath, pdfBuffer);
            console.info("[compile] pdf written", { jobId, servePath });

            // Schedule cleanup after 10 minutes
            setTimeout(() => {
                try {
                    rmSync(jobDir, { recursive: true, force: true });
                    if (existsSync(servePath)) rmSync(servePath);
                } catch {
                    // Cleanup failures are non-critical
                }
            }, 10 * 60 * 1000);

            return NextResponse.json({
                pdfUrl: `/api/compile/${jobId}.pdf`,
                errors,
                log: errors.length > 0 ? log : undefined,
            });
        }

        // Compilation failed — no PDF
        return NextResponse.json(
            {
                pdfUrl: null,
                errors: errors.length > 0 ? errors : [
                    { line: 1, column: 1, message: "Compilation failed. Check your LaTeX syntax.", severity: "error" as const },
                ],
                log,
            },
            { status: 200 } // 200 because this is a valid response, not a server error
        );
    } catch (error) {
        console.error("[compile] unexpected error", error);
        return NextResponse.json(
            { error: "Internal compilation error" },
            { status: 500 }
        );
    }
}

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
    const rl = rateLimit(`compile:${ip}`, 10, 60_000);
    if (!rl.allowed) {
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            planLimits = await getUserLimits(user.id);
        }
    } catch {
        // Auth check is best-effort for compile
    }
    const compileTimeout = planLimits?.compileTimeoutMs ?? 60_000;

    try {
        const { content, projectId } = await request.json();

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

        let log = "";
        let pdfGenerated = false;

        try {
            // Try docker exec first (container running)
            log = execSync(
                `docker exec latexforge-texlive pdflatex -interaction=nonstopmode -output-directory=/workspace/jobs/${jobId}/output /workspace/jobs/${jobId}/document.tex 2>&1`,
                {
                    timeout: compileTimeout,
                    encoding: "utf-8",
                    env: { ...process.env },
                }
            );

            // Second pass for references
            try {
                log += "\n" + execSync(
                    `docker exec latexforge-texlive pdflatex -interaction=nonstopmode -output-directory=/workspace/jobs/${jobId}/output /workspace/jobs/${jobId}/document.tex 2>&1`,
                    {
                        timeout: compileTimeout,
                        encoding: "utf-8",
                    }
                );
            } catch {
                // Second pass failure is non-critical
            }
        } catch (execError: unknown) {
            // Capture output even on non-zero exit
            if (execError && typeof execError === "object" && "stdout" in execError) {
                log = (execError as { stdout: string }).stdout || "";
            }
            if (execError && typeof execError === "object" && "stderr" in execError) {
                log += "\n" + ((execError as { stderr: string }).stderr || "");
            }

            // Fallback: try local pdflatex if docker not available
            try {
                log = execSync(
                    `pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFile}" 2>&1`,
                    {
                        timeout: compileTimeout,
                        encoding: "utf-8",
                    }
                );

                // Second pass
                try {
                    log += "\n" + execSync(
                        `pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFile}" 2>&1`,
                        {
                            timeout: compileTimeout,
                            encoding: "utf-8",
                        }
                    );
                } catch {
                    // Non-critical
                }
            } catch (localError: unknown) {
                if (localError && typeof localError === "object" && "stdout" in localError) {
                    log = (localError as { stdout: string }).stdout || "";
                }
                if (localError && typeof localError === "object" && "stderr" in localError) {
                    log += "\n" + ((localError as { stderr: string }).stderr || "");
                }
            }
        }

        // Check the two possible PDF locations
        const dockerPdfPath = path.join(
            process.cwd(),
            "compile",
            "jobs",
            jobId,
            "output",
            "document.pdf"
        );
        const localPdfPath = path.join(outputDir, "document.pdf");

        let pdfPath = "";
        if (existsSync(dockerPdfPath)) {
            pdfPath = dockerPdfPath;
            pdfGenerated = true;
        } else if (existsSync(localPdfPath)) {
            pdfPath = localPdfPath;
            pdfGenerated = true;
        }

        // Parse errors from the log
        const errors = parseLatexLog(log);

        if (pdfGenerated) {
            // Copy PDF to the job dir for serving
            const servePath = path.join(COMPILE_DIR, `${jobId}.pdf`);
            const pdfBuffer = readFileSync(pdfPath);
            writeFileSync(servePath, pdfBuffer);

            // Schedule cleanup after 10 minutes
            setTimeout(() => {
                try {
                    rmSync(jobDir, { recursive: true, force: true });
                    if (existsSync(servePath)) rmSync(servePath);
                    // Clean docker-side job dir
                    const dockerJobDir = path.join(process.cwd(), "compile", "jobs", jobId);
                    if (existsSync(dockerJobDir)) rmSync(dockerJobDir, { recursive: true, force: true });
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
        console.error("Compile error:", error);
        return NextResponse.json(
            { error: "Internal compilation error" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import archiver from "archiver";
import { PassThrough } from "stream";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "fs";
import { randomUUID } from "crypto";
import pathModule from "path";
import { parseLatexLog } from "@/lib/latex-errors";

const COMPILE_DIR = "/tmp/latexforge";

/**
 * POST /api/export
 * Body: { projectId, format: "zip" | "pdf" }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, format } = await request.json();

    if (!projectId || !format) {
        return NextResponse.json({ error: "Missing projectId or format" }, { status: 400 });
    }

    // Verify ownership
    const { data: project } = await supabase
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch all documents for this project
    const { data: documents } = await supabase
        .from("documents")
        .select("title, content")
        .eq("project_id", projectId);

    if (format === "zip") {
        // Create ZIP archive
        const archive = archiver("zip", { zlib: { level: 9 } });
        const passthrough = new PassThrough();
        archive.pipe(passthrough);

        // Add each document
        if (documents && documents.length > 0) {
            for (const doc of documents) {
                archive.append(doc.content || "", {
                    name: doc.title || "document.tex",
                });
            }
        } else {
            archive.append("% Empty project", { name: "main.tex" });
        }

        // Add a README
        archive.append(
            `# ${project.name}\n\nExported from LatexForge on ${new Date().toISOString()}\n`,
            { name: "README.md" }
        );

        await archive.finalize();

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of passthrough) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.zip"`,
                "Content-Length": buffer.length.toString(),
            },
        });
    }

    if (format === "pdf") {
        // Compile directly instead of HTTP round-trip to /api/compile
        const content = documents?.[0]?.content || "";

        const jobId = randomUUID();
        const jobDir = pathModule.join(COMPILE_DIR, jobId);
        const outputDir = pathModule.join(jobDir, "output");
        mkdirSync(outputDir, { recursive: true });

        const texFile = pathModule.join(jobDir, "document.tex");
        writeFileSync(texFile, content, "utf-8");

        let log = "";
        try {
            log = execSync(
                `pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFile}" 2>&1`,
                { timeout: 60_000, encoding: "utf-8" }
            );
            // Second pass for references
            try {
                log += "\n" + execSync(
                    `pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFile}" 2>&1`,
                    { timeout: 60_000, encoding: "utf-8" }
                );
            } catch {
                // Non-critical
            }
        } catch (err: unknown) {
            if (err && typeof err === "object" && "stdout" in err) {
                log = (err as { stdout: string }).stdout || "";
            }
        }

        const pdfPath = pathModule.join(outputDir, "document.pdf");
        const errors = parseLatexLog(log);

        if (existsSync(pdfPath)) {
            // Copy PDF to serve path
            const servePath = pathModule.join(COMPILE_DIR, `${jobId}.pdf`);
            writeFileSync(servePath, readFileSync(pdfPath));

            // Cleanup after 10 minutes
            setTimeout(() => {
                try {
                    rmSync(jobDir, { recursive: true, force: true });
                    if (existsSync(servePath)) rmSync(servePath);
                } catch { /* non-critical */ }
            }, 10 * 60 * 1000);

            return NextResponse.json({
                success: true,
                pdfUrl: `/api/compile/${jobId}.pdf`,
                errors,
            });
        }

        return NextResponse.json(
            { success: false, error: "Compilation failed", errors },
            { status: 422 }
        );
    }

    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
}


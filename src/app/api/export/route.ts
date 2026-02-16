import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";

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
        // Compile and return the PDF URL (use existing compile endpoint)
        const content = documents?.[0]?.content || "";

        const compileRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/compile`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, projectId }),
            }
        );

        const compileData = await compileRes.json();

        if (compileData.pdfUrl) {
            return NextResponse.json({
                success: true,
                pdfUrl: compileData.pdfUrl,
                errors: compileData.errors || [],
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: "Compilation failed",
                errors: compileData.errors || [],
            },
            { status: 422 }
        );
    }

    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
}

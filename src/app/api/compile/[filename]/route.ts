import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

const COMPILE_DIR = "/tmp/latexforge";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Sanitize filename — only allow uuid.pdf
    if (!/^[a-f0-9-]+\.pdf$/.test(filename)) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(COMPILE_DIR, filename);

    if (!existsSync(filePath)) {
        return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const buffer = readFileSync(filePath);

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "no-store",
        },
    });
}

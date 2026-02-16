export interface LatexError {
    line: number;
    column: number;
    message: string;
    severity: "error" | "warning" | "info";
}

/**
 * Parse pdflatex log output and extract structured errors/warnings.
 * pdflatex outputs errors in the format:
 *   ! LaTeX Error: ...
 *   l.42 \badcommand
 * And warnings like:
 *   LaTeX Warning: ...
 *   Overfull \hbox ...
 */
export function parseLatexLog(log: string): LatexError[] {
    const errors: LatexError[] = [];
    const lines = log.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match fatal errors: "! ..."
        if (line.startsWith("!")) {
            const message = line.slice(2).trim();

            // Look for line number in following lines: "l.42 ..."
            let errorLine = 1;
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const match = lines[j].match(/^l\.(\d+)/);
                if (match) {
                    errorLine = parseInt(match[1], 10);
                    break;
                }
            }

            errors.push({
                line: errorLine,
                column: 1,
                message,
                severity: "error",
            });
        }

        // Match LaTeX warnings with line numbers
        if (line.includes("LaTeX Warning:")) {
            const message = line.replace(/^.*LaTeX Warning:\s*/, "").trim();
            // Try to extract line number from "on input line N"
            const lineMatch = line.match(/on input line (\d+)/);
            errors.push({
                line: lineMatch ? parseInt(lineMatch[1], 10) : 1,
                column: 1,
                message: message || "LaTeX Warning",
                severity: "warning",
            });
        }

        // Match overfull/underfull box warnings
        if (
            line.startsWith("Overfull") ||
            line.startsWith("Underfull")
        ) {
            const lineMatch = line.match(/at lines? (\d+)/);
            errors.push({
                line: lineMatch ? parseInt(lineMatch[1], 10) : 1,
                column: 1,
                message: line.trim(),
                severity: "info",
            });
        }

        // Match "Missing $ inserted" and similar
        if (line.includes("Missing") && line.includes("inserted")) {
            let errorLine = 1;
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const match = lines[j].match(/^l\.(\d+)/);
                if (match) {
                    errorLine = parseInt(match[1], 10);
                    break;
                }
            }
            errors.push({
                line: errorLine,
                column: 1,
                message: line.replace(/^!\s*/, "").trim(),
                severity: "error",
            });
        }
    }

    // Deduplicate by line + message
    const seen = new Set<string>();
    return errors.filter((e) => {
        const key = `${e.line}:${e.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

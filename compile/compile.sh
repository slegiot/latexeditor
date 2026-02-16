#!/usr/bin/env bash
# LatexForge — TeXLive compile helper
# Usage: ./compile.sh <input.tex> [output_dir]
#
# Compiles a .tex file to PDF using pdflatex (two-pass for references).

set -euo pipefail

INPUT="${1:?Usage: compile.sh <input.tex> [output_dir]}"
OUTPUT_DIR="${2:-/workspace/output}"

mkdir -p "$OUTPUT_DIR"

echo "📄 Compiling: $INPUT"
echo "📁 Output:    $OUTPUT_DIR"

# First pass
pdflatex -interaction=nonstopmode -output-directory="$OUTPUT_DIR" "$INPUT" || true

# Second pass (for references, TOC, etc.)
pdflatex -interaction=nonstopmode -output-directory="$OUTPUT_DIR" "$INPUT"

echo "✅ Compilation complete."
ls -la "$OUTPUT_DIR"/*.pdf 2>/dev/null || echo "⚠️  No PDF generated — check logs above."

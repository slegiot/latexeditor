#!/bin/bash
# ─────────────────────────────────────────────────────────────
# LaTeXForge — Sandboxed LaTeX Compilation Script
# ─────────────────────────────────────────────────────────────
# Runs inside the texlive container with:
#   - No network, read-only rootfs, capped resources
#   - 60s hard timeout on compilation
#   - SyncTeX output for source↔PDF sync
#   - Structured exit codes for the worker to interpret
#
# Usage: compile.sh <entrypoint.tex> [extra latexmk args...]
#
# Exit codes:
#   0 — Success (PDF + .synctex.gz written to /work/output/)
#   1 — Missing or invalid entrypoint
#   2 — Compilation error (see log)
#   3 — Timeout exceeded
# ─────────────────────────────────────────────────────────────

set -euo pipefail

TIMEOUT=60
ENTRYPOINT_FILE="${1:-}"
OUTPUT_DIR="/work/output"

# Shift to consume remaining args as extra latexmk flags
shift || true

# ── Validate input ────────────────────────────────────────────
if [ -z "$ENTRYPOINT_FILE" ]; then
  echo "ERROR: No entrypoint file specified."
  echo "Usage: compile.sh <entrypoint.tex> [extra args...]"
  exit 1
fi

if [ ! -f "/work/source/$ENTRYPOINT_FILE" ]; then
  echo "ERROR: Entrypoint file not found: /work/source/$ENTRYPOINT_FILE"
  exit 1
fi

if [[ "$ENTRYPOINT_FILE" != *.tex ]]; then
  echo "ERROR: Entrypoint must be a .tex file, got: $ENTRYPOINT_FILE"
  exit 1
fi

# ── Prepare workspace ────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"
cd /work/source

echo "╔══════════════════════════════════════════════════╗"
echo "║  LaTeXForge Compiler                             ║"
echo "║  Entrypoint: $ENTRYPOINT_FILE"
echo "║  Timeout:    ${TIMEOUT}s"
echo "║  SyncTeX:    enabled"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Compile with latexmk ─────────────────────────────────────
BASENAME="${ENTRYPOINT_FILE%.tex}"

compile_tex() {
  latexmk \
    -pdf \
    -synctex=1 \
    -interaction=nonstopmode \
    -halt-on-error \
    -file-line-error \
    -output-directory="$OUTPUT_DIR" \
    "$@" \
    "$ENTRYPOINT_FILE"
}

# Run compilation with timeout, passing any extra args
if timeout "$TIMEOUT" bash -c "$(declare -f compile_tex); compile_tex $*" 2>&1; then
  # ── Success ─────────────────────────────────────────────────
  PDF_PATH="$OUTPUT_DIR/$BASENAME.pdf"
  SYNCTEX_PATH="$OUTPUT_DIR/$BASENAME.synctex.gz"

  if [ -f "$PDF_PATH" ]; then
    PDF_SIZE=$(stat -c%s "$PDF_PATH" 2>/dev/null || stat -f%z "$PDF_PATH" 2>/dev/null || echo "unknown")
    echo ""
    echo "✓ Compilation successful"
    echo "  PDF:     $PDF_PATH ($PDF_SIZE bytes)"

    if [ -f "$SYNCTEX_PATH" ]; then
      SYNC_SIZE=$(stat -c%s "$SYNCTEX_PATH" 2>/dev/null || stat -f%z "$SYNCTEX_PATH" 2>/dev/null || echo "unknown")
      echo "  SyncTeX: $SYNCTEX_PATH ($SYNC_SIZE bytes)"
    else
      echo "  SyncTeX: not generated"
    fi

    exit 0
  else
    echo ""
    echo "✗ latexmk exited 0 but no PDF was produced"
    exit 2
  fi
else
  EXIT_CODE=$?
  if [ "$EXIT_CODE" -eq 124 ]; then
    echo ""
    echo "✗ Compilation timed out after ${TIMEOUT}s"
    exit 3
  else
    echo ""
    echo "✗ Compilation failed (exit code: $EXIT_CODE)"
    echo "  Check the log above for errors."
    exit 2
  fi
fi

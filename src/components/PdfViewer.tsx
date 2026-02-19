'use client';

// ─────────────────────────────────────────────────────────────
// LaTeXForge — PDF Viewer Component
// ─────────────────────────────────────────────────────────────
// Renders a compiled PDF using PDF.js (pdfjs-dist) with:
//   ✦ Page-by-page rendering to canvas elements
//   ✦ Smooth scrolling and zoom controls
//   ✦ Click-to-sync (inverse SyncTeX lookup)
//   ✦ Programmatic scroll-to-page + y-offset
//   ✦ Page change tracking for sync-scroll
// ─────────────────────────────────────────────────────────────

import React, {
    useRef,
    useEffect,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from 'react';

// ── Types ────────────────────────────────────────────────────

export interface PdfViewerProps {
    /** URL or Blob URL of the PDF to display */
    pdfUrl: string | null;

    /** Theme for the viewer chrome */
    theme?: 'dark' | 'light';

    /** Initial zoom level (1 = 100%) */
    initialZoom?: number;

    /** Called when visible page changes (for sync-scroll) */
    onPageChange?: (page: number, scrollFraction: number) => void;

    /** Called when user clicks a position on the PDF (for inverse sync) */
    onPdfClick?: (page: number, x: number, y: number) => void;

    /** CSS class for the container */
    className?: string;
}

export interface PdfViewerHandle {
    /** Scroll to a specific page and vertical offset */
    scrollToPosition: (page: number, yNorm: number) => void;
    /** Get current page number */
    getCurrentPage: () => number;
    /** Set zoom level */
    setZoom: (zoom: number) => void;
}

// PDF.js types (loaded dynamically)
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;
type PDFPageProxy = import('pdfjs-dist/types/src/display/api').PDFPageProxy;

// ── Component ────────────────────────────────────────────────

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
    function PdfViewer(
        {
            pdfUrl,
            theme = 'dark',
            initialZoom = 1.0,
            onPageChange,
            onPdfClick,
            className = '',
        },
        ref
    ) {
        const containerRef = useRef<HTMLDivElement>(null);
        const pagesContainerRef = useRef<HTMLDivElement>(null);
        const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
        const pageCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
        const renderTasksRef = useRef<Map<number, { cancel: () => void }>>(new Map());

        const [pageCount, setPageCount] = useState(0);
        const [currentPage, setCurrentPage] = useState(1);
        const [zoom, setZoomState] = useState(initialZoom);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        // ── Imperative Handle ──────────────────────────────────
        useImperativeHandle(ref, () => ({
            scrollToPosition(page: number, yNorm: number) {
                scrollToPagePosition(page, yNorm);
            },
            getCurrentPage() {
                return currentPage;
            },
            setZoom(z: number) {
                setZoomState(Math.max(0.25, Math.min(4, z)));
            },
        }));

        // ── Load PDF Document ──────────────────────────────────
        useEffect(() => {
            if (!pdfUrl) {
                pdfDocRef.current = null;
                setPageCount(0);
                setError(null);
                return;
            }

            let cancelled = false;

            async function loadPdf() {
                setIsLoading(true);
                setError(null);

                try {
                    const pdfjsLib = await import('pdfjs-dist');

                    // Configure worker
                    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

                    const loadingTask = pdfjsLib.getDocument(pdfUrl!);
                    const doc = await loadingTask.promise;

                    if (cancelled) {
                        doc.destroy();
                        return;
                    }

                    pdfDocRef.current = doc;
                    setPageCount(doc.numPages);
                    setCurrentPage(1);
                } catch (err) {
                    if (!cancelled) {
                        setError(err instanceof Error ? err.message : 'Failed to load PDF');
                        console.error('[PdfViewer] Load error:', err);
                    }
                } finally {
                    if (!cancelled) setIsLoading(false);
                }
            }

            loadPdf();

            return () => {
                cancelled = true;
                pdfDocRef.current?.destroy();
                pdfDocRef.current = null;
            };
        }, [pdfUrl]);

        // ── Render Pages ────────────────────────────────────────
        const renderPage = useCallback(
            async (pageNum: number) => {
                const doc = pdfDocRef.current;
                if (!doc) return;

                const canvas = pageCanvasRefs.current.get(pageNum);
                if (!canvas) return;

                // Cancel any existing render for this page
                const existing = renderTasksRef.current.get(pageNum);
                if (existing) {
                    existing.cancel();
                    renderTasksRef.current.delete(pageNum);
                }

                try {
                    const page: PDFPageProxy = await doc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: zoom * window.devicePixelRatio });

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
                    canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const renderTask = page.render({
                        canvasContext: ctx,
                        viewport,
                    });

                    renderTasksRef.current.set(pageNum, {
                        cancel: () => renderTask.cancel(),
                    });

                    await renderTask.promise;
                    renderTasksRef.current.delete(pageNum);
                } catch (err) {
                    // Ignore cancellation errors
                    if (err instanceof Error && err.message !== 'Rendering cancelled') {
                        console.error(`[PdfViewer] Render error page ${pageNum}:`, err);
                    }
                }
            },
            [zoom]
        );

        // Re-render all pages when zoom or document changes
        useEffect(() => {
            if (pageCount === 0) return;

            for (let i = 1; i <= pageCount; i++) {
                renderPage(i);
            }
        }, [pageCount, zoom, renderPage]);

        // ── Scroll Tracking ─────────────────────────────────────
        useEffect(() => {
            const container = pagesContainerRef.current;
            if (!container || pageCount === 0) return;

            function handleScroll() {
                if (!container) return;

                const scrollTop = container.scrollTop;
                const pages = container.querySelectorAll<HTMLDivElement>('.pdf-page-wrapper');

                let visiblePage = 1;
                let scrollFraction = 0;

                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];
                    const pageTop = page.offsetTop - container.offsetTop;
                    const pageBottom = pageTop + page.clientHeight;

                    if (scrollTop >= pageTop && scrollTop < pageBottom) {
                        visiblePage = i + 1;
                        scrollFraction = (scrollTop - pageTop) / page.clientHeight;
                        break;
                    }
                }

                if (visiblePage !== currentPage) {
                    setCurrentPage(visiblePage);
                }

                onPageChange?.(visiblePage, scrollFraction);
            }

            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }, [pageCount, currentPage, onPageChange]);

        // ── Click Handler (Inverse Sync) ────────────────────────
        const handleCanvasClick = useCallback(
            (pageNum: number, event: React.MouseEvent<HTMLCanvasElement>) => {
                if (!onPdfClick) return;

                const canvas = event.currentTarget;
                const rect = canvas.getBoundingClientRect();

                // Convert click position to PDF points
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                const x = (event.clientX - rect.left) * scaleX / (zoom * window.devicePixelRatio);
                const y = (event.clientY - rect.top) * scaleY / (zoom * window.devicePixelRatio);

                onPdfClick(pageNum, x, y);
            },
            [onPdfClick, zoom]
        );

        // ── Programmatic Scroll ─────────────────────────────────
        function scrollToPagePosition(page: number, yNorm: number) {
            const container = pagesContainerRef.current;
            if (!container) return;

            const pageElements = container.querySelectorAll<HTMLDivElement>('.pdf-page-wrapper');
            const targetPage = pageElements[page - 1];
            if (!targetPage) return;

            const pageTop = targetPage.offsetTop - container.offsetTop;
            const yOffset = yNorm * targetPage.clientHeight;

            container.scrollTo({
                top: pageTop + yOffset,
                behavior: 'smooth',
            });
        }

        // ── Canvas Ref Callback ─────────────────────────────────
        const setCanvasRef = useCallback(
            (pageNum: number) => (el: HTMLCanvasElement | null) => {
                if (el) {
                    pageCanvasRefs.current.set(pageNum, el);
                } else {
                    pageCanvasRefs.current.delete(pageNum);
                }
            },
            []
        );

        // ── Zoom Controls ───────────────────────────────────────
        const zoomIn = useCallback(() => setZoomState((z) => Math.min(4, z + 0.25)), []);
        const zoomOut = useCallback(() => setZoomState((z) => Math.max(0.25, z - 0.25)), []);
        const zoomFit = useCallback(() => setZoomState(1), []);

        const isDark = theme === 'dark';

        return (
            <div className={`pdf-viewer-container ${className}`}>
                <style dangerouslySetInnerHTML={{
                    __html: `
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${isDark ? '#181825' : '#F0F0F0'};
  border-radius: 12px;
  overflow: hidden;
}
.pdf-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${isDark ? '#1E1E2E' : '#FAFAFA'};
  border-bottom: 1px solid ${isDark ? '#313244' : '#E0E0E0'};
  font-size: 13px;
  color: ${isDark ? '#CDD6F4' : '#383A42'};
  flex-shrink: 0;
}
.pdf-toolbar-btn {
  width: 28px;
  height: 28px;
  border: 1px solid ${isDark ? '#45475A' : '#D0D0D0'};
  border-radius: 6px;
  background: ${isDark ? '#313244' : '#E8E8E8'};
  color: ${isDark ? '#CDD6F4' : '#383A42'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: all 0.15s ease;
}
.pdf-toolbar-btn:hover {
  background: ${isDark ? '#45475A' : '#D0D0D0'};
}
.pdf-toolbar-sep {
  width: 1px;
  height: 20px;
  background: ${isDark ? '#45475A' : '#D0D0D0'};
}
.pdf-toolbar-label {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.pdf-pages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.pdf-page-wrapper {
  box-shadow: 0 2px 12px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'});
  border-radius: 4px;
  overflow: hidden;
  line-height: 0;
  flex-shrink: 0;
}
.pdf-page-wrapper canvas {
  cursor: crosshair;
}
.pdf-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${isDark ? '#585B70' : '#9D9D9F'};
  font-size: 14px;
}
.pdf-empty-icon {
  font-size: 48px;
  opacity: 0.3;
}
.pdf-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${isDark ? '#585B70' : '#9D9D9F'};
}
.pdf-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${isDark ? '#F38BA8' : '#E45649'};
  font-size: 13px;
  text-align: center;
  padding: 24px;
}
          `,
                }} />

                {/* ── Toolbar ─────────────────────────────────── */}
                <div className="pdf-toolbar">
                    <button className="pdf-toolbar-btn" onClick={zoomOut} title="Zoom Out">−</button>
                    <span className="pdf-toolbar-label">{Math.round(zoom * 100)}%</span>
                    <button className="pdf-toolbar-btn" onClick={zoomIn} title="Zoom In">+</button>
                    <button className="pdf-toolbar-btn" onClick={zoomFit} title="Reset Zoom" style={{ fontSize: 11 }}>Fit</button>
                    <div className="pdf-toolbar-sep" />
                    <span className="pdf-toolbar-label">
                        Page {currentPage} of {pageCount}
                    </span>
                </div>

                {/* ── Content ─────────────────────────────────── */}
                {isLoading && (
                    <div className="pdf-loading">Loading PDF...</div>
                )}

                {error && (
                    <div className="pdf-error">
                        <span style={{ fontSize: 32 }}>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {!pdfUrl && !isLoading && !error && (
                    <div className="pdf-empty-state">
                        <span className="pdf-empty-icon">📄</span>
                        <span>Compile your project to see the PDF preview</span>
                    </div>
                )}

                {pdfUrl && !isLoading && !error && pageCount > 0 && (
                    <div
                        ref={pagesContainerRef}
                        className="pdf-pages-container"
                    >
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                            <div key={pageNum} className="pdf-page-wrapper" data-page={pageNum}>
                                <canvas
                                    ref={setCanvasRef(pageNum)}
                                    onClick={(e) => handleCanvasClick(pageNum, e)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

export default PdfViewer;

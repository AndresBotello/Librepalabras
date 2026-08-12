import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

/**
 * Carga progresiva. Cloudinary anuncia `Accept-Ranges: bytes` pero responde 200
 * con el cuerpo completo, así que el paginado por rangos de bytes no está
 * disponible: pedirlo solo añadiría peticiones inútiles. Lo que sí aprovechamos:
 *
 *  - `disableStream: false` → pdf.js va parseando según llegan los bytes en vez
 *    de esperar a tener el archivo entero en memoria.
 *  - `onLoadProgress` → barra de progreso real durante la descarga.
 *  - Solo se rasterizan las páginas cercanas a la ventana, no las 60 de la
 *    revista: el resto son huecos del mismo alto, así la barra de scroll mide
 *    bien desde el principio y no da saltos al avanzar.
 *
 * Si algún día el PDF se sirve desde un origen que sí honre Range, pdf.js
 * empieza a paginar por bytes sin tocar nada aquí.
 *
 * Va fuera del componente porque react-pdf recarga el documento entero si
 * `options` cambia de identidad en cada render.
 */
const PDF_OPTIONS = {
  disableStream: false,
  disableAutoFetch: false,
};

const PAGE_GAP = 20;
// Cuántas páginas se rasterizan por encima y por debajo de la actual. Con 2 hay
// margen para un scroll rápido sin llegar a ver el hueco vacío.
const RENDER_MARGIN = 2;
// Proporción A4 vertical, usada hasta saber la real del documento.
const DEFAULT_ASPECT = 1 / Math.SQRT2;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Quien lo use debe pasarle `key={idDeLaEdición}`: al cambiar de revista el
// componente se remonta y el estado (página, zoom, progreso) parte de cero solo,
// sin un efecto que lo reinicie a mano.
export default function MagazineViewer({ url, isDark, title }) {
  const [numPages, setNumPages] = useState(null);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [viewport, setViewport] = useState({ width: 800, height: 700 });

  const scrollRef = useRef(null);
  const scrollFrame = useRef(null);

  const file = useMemo(() => (url ? { url } : null), [url]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Zoom 100% = página completa a la vista. Se parte del alto disponible y no
  // del ancho: así no hay que hacer scroll para ver el pie de una página.
  const pageWidth = useMemo(() => {
    const fitToHeight = (viewport.height - PAGE_GAP * 2) * aspect;
    const fitToWidth = viewport.width - PAGE_GAP * 2;

    return Math.max(240, Math.min(fitToWidth, fitToHeight) * zoom);
  }, [viewport, aspect, zoom]);

  const pageHeight = pageWidth / aspect;
  const pageStride = pageHeight + PAGE_GAP;

  // La lista lleva PAGE_GAP de padding arriba, así que la página N empieza
  // desplazada por ese hueco. Ambos sentidos (leer scroll / ir a página) usan
  // esta misma fórmula para no descuadrarse.
  const offsetForPage = useCallback(
    (number) => PAGE_GAP + (number - 1) * pageStride,
    [pageStride]
  );

  const handleScroll = useCallback(() => {
    // El scroll dispara muchísimos eventos; con rAF se recalcula una vez por
    // frame como mucho, y solo se re-renderiza si cambió la página.
    if (scrollFrame.current) return;

    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;

      const element = scrollRef.current;
      if (!element || !numPages) return;

      const index = Math.floor((element.scrollTop - PAGE_GAP + pageHeight / 2) / pageStride) + 1;
      setCurrentPage((previous) => {
        const next = clamp(index, 1, numPages);
        return next === previous ? previous : next;
      });
    });
  }, [numPages, pageHeight, pageStride]);

  useEffect(() => () => {
    if (scrollFrame.current) cancelAnimationFrame(scrollFrame.current);
  }, []);

  // Al cambiar el zoom (o al redimensionar) cambia el alto de cada página, y con
  // el mismo scrollTop el lector acabaría en otra parte de la revista. Se guarda
  // la página actual en una ref para poder reanclar sin meterla en las deps y
  // provocar un reanclado en cada scroll.
  const anchorPage = useRef(1);

  useEffect(() => {
    anchorPage.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !numPages) return;

    element.scrollTop = PAGE_GAP + (anchorPage.current - 1) * pageStride;
  }, [pageStride, numPages]);

  const goToPage = useCallback((target) => {
    const element = scrollRef.current;
    if (!element || !numPages) return;

    element.scrollTo({
      top: offsetForPage(clamp(target, 1, numPages)),
      behavior: 'smooth',
    });
  }, [numPages, offsetForPage]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') goToPage(currentPage - 1);
      if (event.key === 'ArrowRight' || event.key === 'PageDown') goToPage(currentPage + 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToPage, currentPage]);

  if (!url) {
    return (
      <div className={`p-8 rounded-2xl text-center text-sm ${isDark ? 'bg-stone-900 text-stone-400' : 'bg-stone-100 text-stone-600'}`}>
        Esta edición todavía no tiene un PDF asociado.
      </div>
    );
  }

  const controlButton = `p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
    isDark ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
  }`;

  const firstRendered = Math.max(1, currentPage - RENDER_MARGIN);
  const lastRendered = Math.min(numPages || 1, currentPage + RENDER_MARGIN);

  return (
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-stone-200'}`}>
      {/* Barra de controles */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b ${
        isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className={controlButton}
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className={`text-sm font-medium tabular-nums ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            {loading ? 'Cargando…' : `${currentPage} / ${numPages}`}
          </span>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!numPages || currentPage >= numPages || loading}
            className={controlButton}
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
            disabled={zoom <= 0.6}
            className={controlButton}
            aria-label="Reducir"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className={`text-xs font-medium tabular-nums w-10 text-center ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
            disabled={zoom >= 2.5}
            className={controlButton}
            aria-label="Ampliar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={zoom === 1}
            className={controlButton}
            aria-label="Ajustar a la página"
            title="Ajustar a la página"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
          </a>
        </div>
      </div>

      {/* Lienzo con scroll continuo */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`overflow-auto ${isDark ? 'bg-stone-950' : 'bg-stone-100'}`}
        style={{ height: '80vh' }}
      >
        {error ? (
          <div className={`p-8 text-center text-sm ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            {error}
          </div>
        ) : (
          <Document
            file={file}
            options={PDF_OPTIONS}
            onLoadProgress={({ loaded, total }) => {
              if (total) setProgress(Math.round((loaded / total) * 100));
            }}
            onLoadSuccess={async (pdf) => {
              setNumPages(pdf.numPages);

              // La proporción real del documento define el alto de los huecos y
              // el zoom "a página completa".
              try {
                const page = await pdf.getPage(1);
                const { width, height } = page.getViewport({ scale: 1 });
                if (height > 0) setAspect(width / height);
              } catch {
                // Si no se puede leer, el A4 por defecto es una aproximación válida.
              }

              setLoading(false);
            }}
            onLoadError={(err) => {
              setError(`No se pudo cargar la revista: ${err.message}`);
              setLoading(false);
            }}
            loading={
              <div className="flex flex-col items-center gap-4 py-20 px-6">
                <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Preparando {title || 'la revista'}…
                </div>

                <div className={`w-full max-w-xs h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-stone-300'}`}>
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <span className={`text-xs tabular-nums ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                  {progress}%
                </span>
              </div>
            }
          >
            <div className="flex flex-col items-center" style={{ gap: PAGE_GAP, paddingBlock: PAGE_GAP }}>
              {Array.from({ length: numPages || 0 }, (_, index) => index + 1).map((number) => {
                const isRendered = number >= firstRendered && number <= lastRendered;

                return (
                  <div
                    key={number}
                    style={{ width: pageWidth, height: pageHeight }}
                    // El alto fijo es lo que mantiene el scroll estable. `overflow-hidden`
                    // es un seguro por si alguna página del PDF no tiene la misma
                    // proporción que la primera: se recorta en vez de descuadrar la lista.
                    className={`flex-shrink-0 overflow-hidden shadow-lg ${isDark ? 'bg-stone-900' : 'bg-white'}`}
                  >
                    {isRendered ? (
                      <Page
                        pageNumber={number}
                        width={pageWidth}
                        renderTextLayer
                        renderAnnotationLayer
                        loading={
                          <div
                            style={{ height: pageHeight }}
                            className={`flex items-center justify-center text-xs ${isDark ? 'text-stone-600' : 'text-stone-400'}`}
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        }
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-xs ${
                        isDark ? 'text-stone-700' : 'text-stone-300'
                      }`}>
                        {number}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}

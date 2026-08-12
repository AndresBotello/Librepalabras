import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getPdfViewUrl } from '../utils/pdfUtils';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function PdfViewer({ url, isDark }) {
  const viewUrl = useMemo(() => getPdfViewUrl(url), [url]);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setError(`Error al cargar PDF: ${error.message}`);
    setLoading(false);
  };

  if (!viewUrl) {
    return (
      <div className={`p-6 rounded-lg text-center ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
        Sin PDF disponible
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
      {/* Controles */}
      <div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between ${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
        <div className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {loading ? 'Cargando PDF...' : `Página ${pageNumber} de ${numPages}`}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1 || loading}
            className={`px-3 py-2 rounded text-sm font-semibold ${
              pageNumber <= 1 || loading
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← Anterior
          </button>

          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages || loading}
            className={`px-3 py-2 rounded text-sm font-semibold ${
              pageNumber >= numPages || loading
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Siguiente →
          </button>

          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800"
          >
            ⬇️ Descargar
          </a>
        </div>
      </div>

      {/* Contenedor del PDF */}
      <div className={`overflow-auto flex justify-center py-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={{ maxHeight: '600px' }}>
        {error && (
          <div className={`p-6 text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </div>
        )}

        {!error && (
          <Document
            file={viewUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando PDF...</div>}
          >
            <Page pageNumber={pageNumber} width={Math.min(800, window.innerWidth - 40)} />
          </Document>
        )}
      </div>
    </div>
  );
}

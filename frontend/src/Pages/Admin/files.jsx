import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getPdfFiles, deletePdfFile } from '../../services/api';
import { Eye, Copy, Trash2, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function Files() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);

  // Verificar si es admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('No tienes permiso para acceder a esta sección');
    }
  }, [user]);

  // Cargar archivos
  useEffect(() => {
    loadFiles();
  }, [search, sortBy, currentPage, pageSize]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const offset = (currentPage - 1) * pageSize;
      const response = await getPdfFiles(search, sortBy, pageSize, offset);

      if (response.ok) {
        setFiles(response.files);
        setTotalFiles(response.total);
        setTotalPages(response.pages);
      } else {
        setError(response.message || 'Error al cargar archivos');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!deleteConfirm || deleteConfirm !== fileId) {
      setDeleteConfirm(fileId);
      return;
    }

    setDeleting(true);
    try {
      const response = await deletePdfFile(fileId);
      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        setDeleteConfirm(null);
      } else {
        setError(response.message || 'Error al eliminar archivo');
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar archivo');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (url, fileId) => {
    navigator.clipboard.writeText(url);
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleViewPdf = (file) => {
    setViewerFile(file);
    setPdfCurrentPage(1);
  };

  const onPdfLoadSuccess = ({ numPages }) => {
    setPdfPages(numPages);
  };

  const nextPdfPage = () => {
    setPdfCurrentPage(Math.min(pdfPages, pdfCurrentPage + 1));
  };

  const prevPdfPage = () => {
    setPdfCurrentPage(Math.max(1, pdfCurrentPage - 1));
  };

  if (user && user.role !== 'admin') {
    return (
      <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className={`p-8 rounded-2xl text-center max-w-md shadow-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Acceso Denegado
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
              Solo los administradores pueden acceder a esta sección.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="max-w-7xl mx-auto">
              <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Gestión de Archivos PDF
              </h1>
              <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Administra todos los archivos PDF subidos en las obras literarias.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto space-y-6">
              {error && (
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {error}
                </div>
              )}

              {/* Filtros y búsqueda */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className={`absolute left-3 top-3 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      placeholder="Buscar por título o autor..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-100'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="date">Más recientes primero</option>
                  <option value="title">Ordenar por título</option>
                  <option value="author">Ordenar por autor</option>
                </select>
              </div>

              {/* Información */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                <p className="text-sm">
                  Total de archivos: <span className="font-semibold">{totalFiles}</span> •
                  Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                </p>
              </div>

              {/* Tabla */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 mx-auto mb-4"></div>
                    <p>Cargando archivos...</p>
                  </div>
                </div>
              ) : files.length === 0 ? (
                <div className={`p-12 text-center rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    No hay archivos PDF
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {search ? 'No se encontraron archivos con esa búsqueda' : 'No hay archivos PDF subidos aún'}
                  </p>
                </div>
              ) : (
                <div className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                          <th className={`px-6 py-4 text-left font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Título
                          </th>
                          <th className={`px-6 py-4 text-left font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Autor
                          </th>
                          <th className={`px-6 py-4 text-left font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Fecha
                          </th>
                          <th className={`px-6 py-4 text-center font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            👁 Vistas
                          </th>
                          <th className={`px-6 py-4 text-center font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            💬 Comentarios
                          </th>
                          <th className={`px-6 py-4 text-center font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            ⭐ Valoraciones
                          </th>
                          <th className={`px-6 py-4 text-center font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Estado
                          </th>
                          <th className={`px-6 py-4 text-left font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr
                            key={file.id}
                            className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}
                          >
                            <td className={`px-6 py-4 font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                              <div className="truncate max-w-xs" title={file.title}>
                                {file.title}
                              </div>
                            </td>
                            <td className={`px-6 py-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <div className="truncate max-w-xs" title={file.author}>
                                {file.author}
                              </div>
                            </td>
                            <td className={`px-6 py-4 transition-colors text-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatDate(file.uploadedAt)}
                            </td>
                            <td className={`px-6 py-4 text-center transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {file.views || 0}
                            </td>
                            <td className={`px-6 py-4 text-center transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {file.totalComments || 0}
                            </td>
                            <td className={`px-6 py-4 text-center transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {file.totalRatings || 0}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                file.status === 'approved'
                                  ? isDark
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-green-100 text-green-800'
                                  : isDark
                                  ? 'bg-yellow-900 text-yellow-200'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {file.status === 'approved' ? 'Publicado' : 'Borrador'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewPdf(file)}
                                  className={`p-2 rounded transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                                  title="Ver PDF"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => copyToClipboard(file.pdfUrl, file.id)}
                                  className={`p-2 rounded transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                                  title="Copiar URL"
                                >
                                  <Copy className={`w-4 h-4 ${copiedId === file.id ? 'text-green-500' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleDelete(file.id)}
                                  disabled={deleting}
                                  className={`p-2 rounded transition-colors ${
                                    deleteConfirm === file.id
                                      ? isDark
                                        ? 'bg-red-900 text-red-200'
                                        : 'bg-red-100 text-red-800'
                                      : isDark
                                      ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                                      : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                                  }`}
                                  title={deleteConfirm === file.id ? 'Confirmar eliminación' : 'Eliminar'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-100'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded transition-colors ${
                        currentPage === 1
                          ? isDark
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className={`px-4 py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentPage} de {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded transition-colors ${
                        currentPage === totalPages
                          ? isDark
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Visor PDF */}
      {viewerFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg w-full h-full max-w-7xl flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {viewerFile.title}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Por {viewerFile.author}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewerFile(null);
                  setPdfPages(0);
                  setPdfCurrentPage(1);
                }}
                className={`p-2 rounded-lg transition-colors ml-4 flex-shrink-0 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className={`flex-1 flex flex-col items-center justify-start overflow-auto pt-6 ${isDark ? 'bg-gray-950' : 'bg-gray-100'}`}>
              <Document
                file={viewerFile.pdfUrl}
                onLoadSuccess={onPdfLoadSuccess}
                error={<p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Error al cargar el PDF</p>}
                loading={<p className={`text-sm animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando PDF...</p>}
              >
                <Page
                  pageNumber={pdfCurrentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  scale={0.9}
                  width={550}
                />
              </Document>
            </div>

            {/* Controles de paginación */}
            {pdfPages > 0 && (
              <div className={`flex items-center justify-center gap-6 px-6 py-4 border-t flex-shrink-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <button
                  onClick={prevPdfPage}
                  disabled={pdfCurrentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    pdfCurrentPage === 1
                      ? isDark
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 cursor-not-allowed'
                      : isDark
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-gray-100'
                      : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                  }`}
                  title="Página anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Página
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={pdfPages}
                    value={pdfCurrentPage}
                    onChange={(e) => {
                      const page = Math.min(pdfPages, Math.max(1, parseInt(e.target.value) || 1));
                      setPdfCurrentPage(page);
                    }}
                    className={`w-16 px-2 py-1 rounded border text-center text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    de {pdfPages}
                  </span>
                </div>

                <button
                  onClick={nextPdfPage}
                  disabled={pdfCurrentPage === pdfPages}
                  className={`p-2 rounded-lg transition-colors ${
                    pdfCurrentPage === pdfPages
                      ? isDark
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 cursor-not-allowed'
                      : isDark
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-gray-100'
                      : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                  }`}
                  title="Página siguiente"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getPendingWorks, reviewWork } from '../../services/api';
import genresData from '../../config/genres.json';

export default function Moderation() {
  const { isDark } = useContext(ThemeContext);
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  // El error de aprobar/rechazar va dentro del modal: el banner de la página
  // queda tapado por él y la acción parecía no hacer nada al fallar.
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadPendingWorks();
  }, []);

  const loadPendingWorks = async () => {
    try {
      setError('');
      console.log('Cargando obras pendientes...');
      const response = await getPendingWorks();
      console.log('Respuesta:', response);
      if (response.ok) {
        setWorks(response.works || []);
        console.log('Obras cargadas:', response.works);
      } else {
        setError(response.message || 'Error al cargar obras');
      }
    } catch (err) {
      console.error('Error al cargar obras pendientes:', err);
      setError(err.message || 'Error al cargar las obras');
    } finally {
      setLoading(false);
    }
  };

  const getGenreInfo = (genre) => {
    return genresData.genres.find(g => g.value === genre);
  };

  const handleApprove = async (workId) => {
    setProcessing(true);
    setActionError('');
    try {
      const response = await reviewWork(workId, 'approved');
      if (response.ok) {
        setWorks(works.filter(w => w.id !== workId));
        setSelectedWork(null);
        setRejectionReason('');
      } else {
        setActionError(response.message || 'No se pudo aprobar la obra');
      }
    } catch (err) {
      setActionError(err.message || 'No se pudo aprobar la obra');
    } finally {
      setProcessing(false);
    }
  };

  // Cerrar sin limpiar el motivo dejaba el texto escrito para la siguiente obra
  // que se abriera, con el riesgo de rechazarla con el motivo de otra.
  const closeModal = () => {
    if (processing) return;
    setSelectedWork(null);
    setRejectionReason('');
    setActionError('');
  };

  useEffect(() => {
    if (!selectedWork) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !processing) {
        setSelectedWork(null);
        setRejectionReason('');
        setActionError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedWork, processing]);

  const handleReject = async (workId) => {
    if (!rejectionReason.trim()) return;

    setProcessing(true);
    setActionError('');
    try {
      const response = await reviewWork(workId, 'rejected', rejectionReason);
      if (response.ok) {
        setWorks(works.filter(w => w.id !== workId));
        setSelectedWork(null);
        setRejectionReason('');
      } else {
        setActionError(response.message || 'No se pudo rechazar la obra');
      }
    } catch (err) {
      setActionError(err.message || 'No se pudo rechazar la obra');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Moderación
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gestiona y revisa los contenidos enviados por los autores de la plataforma.
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              {error && (
                <div className={`p-4 rounded-lg mb-6 border ${isDark ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-100 border-red-300 text-red-800'}`}>
                  ❌ {error}
                </div>
              )}
              {loading ? (
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando obras pendientes...</p>
              ) : works.length === 0 ? (
                <div className={`p-8 rounded-lg text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ✅ No hay obras pendientes
                  </p>
                  <p className={isDark ? 'text-gray-400 mt-2' : 'text-gray-600 mt-2'}>
                    Todas las obras han sido revisadas
                  </p>
                </div>
              ) : (
                <div className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Título
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Autor
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Género
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Fecha
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {works.map((work) => {
                          const genreInfo = getGenreInfo(work.genre);
                          return (
                            <tr key={work.id} className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {work.title}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {work.author}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {genreInfo?.emoji} {genreInfo?.label}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(work.createdAt).toLocaleDateString('es-CO')}
                              </td>
                              <td className={`px-6 py-4 text-sm`}>
                                <button
                                  onClick={() => setSelectedWork(work)}
                                  className="text-brand-700 hover:text-brand-800 font-semibold"
                                >
                                  Revisar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {selectedWork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-work-title"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-modal-overlay"
            onClick={closeModal}
          />

          {/* Modal */}
          <div
            className={`relative z-10 w-full max-w-2xl max-h-[85vh] rounded-xl border shadow-2xl flex flex-col animate-modal-panel transition-colors ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            {/* Header fijo */}
            <div className={`flex items-start justify-between gap-4 px-6 py-4 border-b flex-shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="min-w-0">
                <h2
                  id="review-work-title"
                  className={`text-xl font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                >
                  {selectedWork.title}
                </h2>
                <p className={`text-sm mt-1 truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Por: <strong>{selectedWork.author}</strong>
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={processing}
                aria-label="Cerrar"
                className={`p-1.5 rounded-lg flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {actionError && (
                <div className={`p-3 rounded-lg text-sm border ${
                  isDark ? 'bg-red-950/40 border-red-900/60 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {actionError}
                </div>
              )}

              {selectedWork.description && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Descripción:
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedWork.description}
                  </p>
                </div>
              )}

              <div>
                <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contenido Previo:
                </p>
                <pre
                  className={`text-xs p-3 rounded-lg max-h-32 overflow-y-auto ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}`}
                >
                  {selectedWork.content.substring(0, 300)}...
                </pre>
              </div>

              {selectedWork.tags && selectedWork.tags.length > 0 && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Etiquetas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWork.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <label htmlFor="rejection-reason" className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Motivo de rechazo
                  </label>
                  <span className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {rejectionReason.length}/300
                  </span>
                </div>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por qué se rechaza la obra..."
                  maxLength="300"
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-300'
                  }`}
                />
                <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Solo hace falta para rechazar: el botón se activa al escribirlo. Para aprobar puedes dejarlo vacío.
                </p>
              </div>
            </div>

            {/* Footer fijo */}
            <div className={`px-6 py-4 border-t flex gap-3 justify-end flex-shrink-0 rounded-b-xl ${
              isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-gray-50'
            }`}>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(selectedWork.id)}
                title={rejectionReason.trim() ? undefined : 'Escribe el motivo de rechazo para activar este botón'}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Procesando...' : 'Rechazar'}
              </button>
              <button
                onClick={() => handleApprove(selectedWork.id)}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={processing}
              >
                {processing ? 'Procesando...' : 'Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

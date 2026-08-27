import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getPendingWorks, reviewWork } from '../../services/api';
import genresData from '../../config/genres.json';
import scopesData from '../../config/scopes.json';

/**
 * Las tres bandejas. La de pendientes es la de trabajo; las otras dos existen
 * porque una obra revisada por error desaparecía de la vista del administrador
 * y no había forma de volver sobre ella desde aquí.
 */
const STATUS_TABS = [
  {
    value: 'pending_review',
    label: 'Pendientes',
    empty: 'No hay obras pendientes',
    hint: 'Todas las obras han sido revisadas',
  },
  {
    value: 'approved',
    label: 'Aprobadas',
    empty: 'Todavía no hay obras aprobadas',
    hint: 'Las que apruebes aparecerán aquí',
  },
  {
    value: 'rejected',
    label: 'Rechazadas',
    empty: 'No hay obras rechazadas',
    hint: 'Las que rechaces aparecerán aquí',
  },
];

export default function Moderation() {
  const { isDark } = useContext(ThemeContext);
  const [statusFilter, setStatusFilter] = useState('pending_review');
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
    let cancelled = false;

    const loadWorks = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getPendingWorks(statusFilter);
        if (cancelled) return;

        if (response.ok) {
          setWorks(response.works || []);
        } else {
          setError(response.message || 'Error al cargar las obras');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar las obras');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadWorks();

    // Cambiar de bandeja deprisa lanza varias peticiones: sin esto, la que
    // tardase más pintaría su lista encima de la pestaña que ya no está activa.
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const activeTab = STATUS_TABS.find((tab) => tab.value === statusFilter);
  const isPendingTab = statusFilter === 'pending_review';

  const getGenreInfo = (genre) => {
    return genresData.genres.find(g => g.value === genre);
  };

  const getScopeInfo = (scope) => {
    return scopesData.scopes.find(s => s.value === scope);
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
              {/* Bandejas */}
              <div className={`inline-flex rounded-xl p-1 mb-6 ${
                isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100'
              }`}>
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    aria-current={statusFilter === tab.value ? 'page' : undefined}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      statusFilter === tab.value
                        ? isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900 shadow-sm'
                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {/* El número solo en la activa: de las otras no se ha pedido
                        la lista, así que cualquier cifra ahí sería inventada. */}
                    {statusFilter === tab.value && !loading && works.length > 0 && (
                      <span className="ml-2 text-xs tabular-nums opacity-60">{works.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <div className={`p-4 rounded-lg mb-6 border ${isDark ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-100 border-red-300 text-red-800'}`}>
                  ❌ {error}
                </div>
              )}
              {loading ? (
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando obras...</p>
              ) : works.length === 0 ? (
                <div className={`p-8 rounded-lg text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {activeTab.empty}
                  </p>
                  <p className={isDark ? 'text-gray-400 mt-2' : 'text-gray-600 mt-2'}>
                    {activeTab.hint}
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
                            Publicación
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {/* En lo pendiente importa cuándo llegó; en lo ya
                                resuelto, cuándo se revisó. */}
                            {isPendingTab ? 'Enviada' : 'Revisada'}
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
                                <span className="font-medium">{work.title}</span>
                                {/* Distintivos para poder priorizar sin abrir cada
                                    obra. El de firma ajena va primero: es el único
                                    que puede estar tapando una suplantación. */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {work.authoredByOther && (
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                                      isDark ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-100 text-orange-900'
                                    }`}>
                                      Firma ajena
                                    </span>
                                  )}
                                  {work.pdfUrl && (
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                      PDF
                                    </span>
                                  )}
                                  {work.cover && (
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                      Portada
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="block">{work.author}</span>
                                {/* El correo es el de la cuenta que sube, que no
                                    tiene por qué ser el del autor firmado. */}
                                {work.authorEmail && (
                                  <span className={`block text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {work.authorEmail}
                                  </span>
                                )}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="block">{genreInfo?.emoji} {genreInfo?.label || work.genre}</span>
                                {work.scope && (
                                  <span className="block text-xs mt-0.5 opacity-80">
                                    {getScopeInfo(work.scope)?.emoji} {getScopeInfo(work.scope)?.label || work.scope}
                                  </span>
                                )}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {work.type === 'pdfSale'
                                  ? `De pago · $${work.price}`
                                  : 'Lectura libre'}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(
                                  isPendingTab ? work.createdAt : (work.updatedAt || work.createdAt)
                                ).toLocaleDateString('es-CO')}
                              </td>
                              <td className={`px-6 py-4 text-sm`}>
                                <button
                                  onClick={() => setSelectedWork(work)}
                                  className="text-brand-700 hover:text-brand-800 font-semibold"
                                >
                                  {isPendingTab ? 'Revisar' : 'Ver'}
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
            className={`relative z-10 w-full max-w-4xl max-h-[90vh] rounded-xl border shadow-2xl flex flex-col animate-modal-panel transition-colors ${
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

              {/* El backend marca `authoredByOther` cuando el nombre firmado no
                  coincide con el de la cuenta que sube. Puede ser un encargo
                  legítimo o una suplantación, y es lo primero que hay que mirar,
                  así que va arriba del todo y no escondido en la ficha. */}
              {selectedWork.authoredByOther && (
                <div className={`p-3 rounded-lg text-sm border ${
                  isDark ? 'bg-orange-950/40 border-orange-900/60 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-900'
                }`}>
                  <strong>La firma no es la de la cuenta.</strong> La obra se publica a nombre
                  de «{selectedWork.author}», pero la sube {selectedWork.authorEmail || 'una cuenta sin correo'}.
                  Comprueba que tenga autorización del autor antes de aprobarla.
                </div>
              )}

              {/* Ficha: portada y datos de publicación. Sin esto había que
                  aprobar a ciegas si la obra traía PDF o iba a venderse. */}
              <div className="flex flex-col sm:flex-row gap-5">
                {selectedWork.cover ? (
                  <img
                    src={selectedWork.cover}
                    alt={`Portada de ${selectedWork.title}`}
                    className={`w-28 aspect-[2/3] object-cover rounded-md border shrink-0 ${
                      isDark ? 'border-gray-800' : 'border-gray-200'
                    }`}
                  />
                ) : (
                  <div className={`w-28 aspect-[2/3] rounded-md border border-dashed shrink-0 flex items-center justify-center text-center text-xs px-2 ${
                    isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-500'
                  }`}>
                    Sin portada
                  </div>
                )}

                <dl className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-sm">
                  <div>
                    <dt className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Género</dt>
                    <dd className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                      {getGenreInfo(selectedWork.genre)?.emoji} {getGenreInfo(selectedWork.genre)?.label || selectedWork.genre}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Alcance</dt>
                    <dd className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                      {selectedWork.scope
                        ? `${getScopeInfo(selectedWork.scope)?.emoji || ''} ${getScopeInfo(selectedWork.scope)?.label || selectedWork.scope}`
                        : 'Sin definir'}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Enviada</dt>
                    <dd className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                      {new Date(selectedWork.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Publicación</dt>
                    <dd className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                      {selectedWork.type === 'pdfSale'
                        ? `Descarga de pago · $${selectedWork.price}`
                        : 'Lectura libre'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Cuenta que sube</dt>
                    <dd className={`break-all ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      {selectedWork.authorEmail || '—'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Documento adjunto</dt>
                    <dd>
                      {selectedWork.pdfUrl ? (
                        <a
                          href={selectedWork.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-brand-700 hover:text-brand-800 underline"
                        >
                          Abrir el PDF en otra pestaña
                        </a>
                      ) : (
                        <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Sin PDF</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {selectedWork.description && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Descripción
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedWork.description}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contenido completo
                  </p>
                  <span className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {(selectedWork.content?.length || 0).toLocaleString('es-CO')} caracteres
                  </span>
                </div>
                {/* Antes esto era `content.substring(0, 300)` dentro de un `pre`
                    de 128px de alto: se moderaba a ciegas sobre el primer párrafo
                    y, al no envolver el `pre`, las líneas largas ni siquiera se
                    leían enteras. Ahora va el texto íntegro, con los saltos de
                    párrafo respetados y las líneas ajustadas al ancho.

                    Lleva su propio scroll en vez de estirar el modal para que el
                    campo de motivo y los botones no se vayan a mil píxeles de
                    distancia en una obra larga. */}
                <div
                  className={`text-sm leading-relaxed p-4 rounded-lg border whitespace-pre-wrap break-words max-h-[45vh] overflow-y-auto ${
                    isDark ? 'bg-gray-950 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  {selectedWork.content?.trim()
                    || 'Esta obra no trae texto propio: la revisión depende del PDF adjunto.'}
                </div>
              </div>

              {selectedWork.tags && selectedWork.tags.length > 0 && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Etiquetas
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

              {/* El motivo con el que se rechazó en su día. Es lo primero que
                  hace falta para decidir si se revierte la decisión. */}
              {selectedWork.status === 'rejected' && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Motivo del rechazo
                  </p>
                  <p className={`text-sm p-3 rounded-lg border ${
                    isDark ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    {selectedWork.rejectionReason || 'Se rechazó sin dejar constancia del motivo.'}
                  </p>
                </div>
              )}

              {/* El campo solo tiene sentido donde queda algo que rechazar o
                  retirar: en una obra ya rechazada, la única acción posible es
                  aprobarla, y esta caja sobraba en pantalla. */}
              {selectedWork.status !== 'rejected' && (
                <div>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <label htmlFor="rejection-reason" className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedWork.status === 'approved' ? 'Motivo de la retirada' : 'Motivo de rechazo'}
                    </label>
                    <span className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {rejectionReason.length}/300
                    </span>
                  </div>
                  <textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={selectedWork.status === 'approved'
                      ? 'Explica por qué se retira una obra ya publicada...'
                      : 'Explica por qué se rechaza la obra...'}
                    maxLength="300"
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-gray-600'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-300'
                    }`}
                  />
                  <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {selectedWork.status === 'approved'
                      ? 'El autor recibe este texto como aviso de que su obra deja de estar publicada.'
                      : 'Solo hace falta para rechazar: el botón se activa al escribirlo. Para aprobar puedes dejarlo vacío.'}
                  </p>
                </div>
              )}
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
              {/* Cada bandeja ofrece solo lo que cambia algo. Sobre una obra ya
                  aprobada, "Aprobar" no haría nada; sobre una rechazada, tampoco
                  "Rechazar". Lo que sí se puede siempre es revertir la decisión
                  contraria, que es justo para lo que sirven estas dos pestañas. */}
              {selectedWork.status !== 'rejected' && (
                <button
                  onClick={() => handleReject(selectedWork.id)}
                  title={rejectionReason.trim() ? undefined : 'Escribe el motivo para activar este botón'}
                  className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processing || !rejectionReason.trim()}
                >
                  {processing
                    ? 'Procesando...'
                    : selectedWork.status === 'approved' ? 'Retirar' : 'Rechazar'}
                </button>
              )}
              {selectedWork.status !== 'approved' && (
                <button
                  onClick={() => handleApprove(selectedWork.id)}
                  className="px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={processing}
                >
                  {processing
                    ? 'Procesando...'
                    : selectedWork.status === 'rejected' ? 'Aprobar ahora' : 'Aprobar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

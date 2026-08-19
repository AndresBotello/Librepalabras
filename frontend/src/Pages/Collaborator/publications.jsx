import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useConfirm, useNotify } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AreaSidebar from '../../components/AreaSidebar';
import PdfViewer from '../../components/PdfViewer';
import { getMyWorks, updateLiteraryWork, deleteLiteraryWork, getAllAuthors, uploadPdf, uploadCover } from '../../services/api';
import genresData from '../../config/genres.json';

// Los mismos topes que aplica el servidor en backend/src/utils/files.js. Aquí
// sirven para avisar antes de subir: sin esto, un archivo de más se pasaba
// entero por la red para que el backend lo rechazara al final.
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export default function Publications() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const notify = useNotify();
  const confirm = useConfirm();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  // Una subida en curso por tipo. Mientras dura, el control se bloquea y dice
  // que está trabajando: antes no había ninguna señal —ni texto ni spinner— y
  // una portada de varios megas tardaba lo suyo con la pantalla igual que antes.
  const [uploading, setUploading] = useState({ cover: false, pdf: false });
  // El catálogo de /authors, para poder asociar la obra a una ficha existente.
  // Si falla la petición el desplegable se queda vacío y la edición sigue
  // funcionando: asociar es opcional.
  const [catalogAuthors, setCatalogAuthors] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    content: '',
    pdfUrl: '',
    cover: '',
    authorProfileId: '',
  });

  useEffect(() => {
    fetchPublications();

    getAllAuthors()
      .then((response) => {
        if (response?.ok) setCatalogAuthors(response.authors || []);
      })
      .catch(() => {});
  }, []);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const data = await getMyWorks();
      setPublications(data.works || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (pub) => {
    setEditingId(pub.id);
    setFormData({
      title: pub.title,
      author: pub.author || '',
      genre: pub.genre,
      description: pub.description || '',
      content: pub.content,
      pdfUrl: pub.pdfUrl || '',
      cover: pub.cover || '',
      authorProfileId: pub.authorProfileId || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowPdfPreview(false);
    setFormData({
      title: '',
      author: '',
      genre: '',
      description: '',
      content: '',
      pdfUrl: '',
      cover: '',
      authorProfileId: '',
    });
  };

  useEffect(() => {
    if (!editingId) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCancelEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingId]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];

    // El input se vacía siempre, pase lo que pase. Sin esto, volver a elegir el
    // mismo archivo tras un fallo no dispara `change` —el valor no ha cambiado—
    // y la pantalla se queda quieta, que es justo la sensación de "no hace nada".
    e.target.value = '';

    if (!file) return;

    const isCover = type === 'cover';
    const limit = isCover ? MAX_COVER_BYTES : MAX_PDF_BYTES;

    if (isCover && !file.type.startsWith('image/')) {
      notify.error('La portada tiene que ser una imagen.');
      return;
    }

    if (file.size > limit) {
      notify.error(`El archivo pesa demasiado: el máximo son ${Math.round(limit / (1024 * 1024))} MB.`);
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const uploadFn = isCover ? uploadCover : uploadPdf;
      const url = await uploadFn(file);

      setFormData(prev => ({
        ...prev,
        [isCover ? 'cover' : 'pdfUrl']: url,
      }));

      // Se avisa de que falta guardar: la subida deja el archivo en el servidor,
      // pero la obra no apunta a él hasta que se pulsa "Guardar cambios".
      notify.success(
        isCover
          ? 'Portada subida. Pulsa "Guardar cambios" para aplicarla.'
          : 'Archivo subido. Pulsa "Guardar cambios" para aplicarlo.'
      );
    } catch (err) {
      notify.error(`No se pudo subir ${isCover ? 'la portada' : 'el archivo'}: ${err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      notify.error('El título y el contenido son obligatorios.');
      return;
    }

    // Obtener la publicación original para comparar
    const originalPub = publications.find(p => p.id === editingId);

    // Si hay PDF nuevo diferente al original, validar que sea el correcto
    if (formData.pdfUrl && originalPub?.pdfUrl && formData.pdfUrl === originalPub.pdfUrl) {
      // Si no cambió el PDF, todo bien
    } else if (formData.pdfUrl && formData.pdfUrl.includes('image/upload')) {
      // El PDF nuevo tiene el formato correcto de Cloudinary
      console.log('✅ PDF nuevo detectado, listo para guardar');
    }

    try {
      console.log('📤 Guardando con pdfUrl:', formData.pdfUrl);

      await updateLiteraryWork(editingId, {
        title: formData.title,
        author: formData.author,
        genre: formData.genre,
        description: formData.description,
        content: formData.content,
        pdfUrl: formData.pdfUrl,
        cover: formData.cover,
        // `null` desasocia la obra de la ficha que tuviera.
        authorProfileId: formData.authorProfileId || null,
      });

      console.log('✅ Publicación guardada exitosamente');
      await fetchPublications();
      handleCancelEdit();
      notify.success('Publicación actualizada correctamente.');
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      notify.error(`No se pudo actualizar: ${err.message}`);
    }
  };

  /**
   * Borrar la obra. Es irreversible —se lleva por delante el PDF y la portada,
   * y con ellos las valoraciones y los comentarios que colgaban de la obra—,
   * así que el diálogo va en rojo y con el nombre delante: pulsar "Eliminar" en
   * la fila equivocada de una tabla es demasiado fácil.
   */
  const handleDeleteClick = async (pub) => {
    const confirmed = await confirm({
      title: `¿Eliminar "${pub.title}"?`,
      message: 'La obra desaparecerá del catálogo y de tus publicaciones.',
      detail: 'También se borran su PDF, su portada, sus comentarios y sus valoraciones. No se puede deshacer.',
      confirmLabel: 'Eliminar obra',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingId(pub.id);

    try {
      await deleteLiteraryWork(pub.id);

      // Si estaba abierta en el modal, se cierra: quedarse editando una obra
      // que ya no existe solo lleva a un 404 al guardar.
      if (editingId === pub.id) handleCancelEdit();

      await fetchPublications();
      notify.success('Publicación eliminada correctamente.');
    } catch (err) {
      notify.error(`No se pudo eliminar: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { label: 'Publicado', color: isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' },
      pending_review: { label: 'Bajo revisión', color: isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rechazado', color: isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800' },
    };

    const info = statusMap[status] || { label: 'Borrador', color: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700' };
    return info;
  };

  const selectedProfile = catalogAuthors.find((author) => author.id === formData.authorProfileId) || null;

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <Navbar />
        <div className="flex flex-1">
          <AreaSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando publicaciones...</div>
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
        <AreaSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 max-w-7xl mx-auto">
              <div className="flex-1">
                <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Mis Publicaciones
                </h1>
                <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Administra todas tus publicaciones y envíos literarios. Total: {publications.length}
                </p>
              </div>
              {/* Era un `button` sin `onClick`: se pulsaba y no pasaba nada. */}
              <Link
                to="/collaborator/create"
                className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-brand-700 text-white hover:bg-brand-800 whitespace-nowrap"
              >
                Nueva publicación
              </Link>
            </div>
          </div>

          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              {error && (
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                  {error}
                </div>
              )}

              {publications.length === 0 ? (
                <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Aún no tienes publicaciones</p>
                </div>
              ) : (
                <div className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                          <th className="w-px px-6 py-4">
                            <span className="sr-only">Portada</span>
                          </th>
                          <th className={`py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Título
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Género
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Estado
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Fecha
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Lecturas
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {publications.map((pub) => {
                          const status = getStatusBadge(pub.status);
                          const date = new Date(pub.createdAt).toLocaleDateString('es-CO');

                          return (
                            <tr key={pub.id} className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}>
                              <td className="px-6 py-4">
                                {pub.cover ? (
                                  <img
                                    src={pub.cover}
                                    alt=""
                                    className={`w-10 aspect-[2/3] object-cover rounded border ${
                                      isDark ? 'border-gray-700' : 'border-gray-200'
                                    }`}
                                  />
                                ) : (
                                  <div className={`w-10 aspect-[2/3] rounded border border-dashed ${
                                    isDark ? 'border-gray-700' : 'border-gray-300'
                                  }`} />
                                )}
                              </td>
                              <td className={`py-4 pr-6 text-sm transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                <span className="font-semibold">{pub.title}</span>
                                {/* El motivo del rechazo estaba en la obra pero
                                    no se enseñaba en ningún sitio: el autor veía
                                    "Rechazado" y se quedaba sin saber qué
                                    corregir. */}
                                {pub.status === 'rejected' && (
                                  <p className={`mt-1 text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                    {pub.rejectionReason || 'Se rechazó sin indicar el motivo.'}
                                  </p>
                                )}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {genresData.genres.find(g => g.value === pub.genre)?.label || pub.genre}
                              </td>
                              <td className={`px-6 py-4 text-sm`}>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {date}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {pub.views || 0}
                              </td>
                              <td className={`px-6 py-4 text-sm`}>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() => handleEditClick(pub)}
                                    className={`font-semibold transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(pub)}
                                    disabled={deletingId === pub.id}
                                    className={`font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                                  >
                                    {deletingId === pub.id ? 'Eliminando…' : 'Eliminar'}
                                  </button>
                                </div>
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

      {/* Modal de edición */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-work-title"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-modal-overlay"
            onClick={handleCancelEdit}
          />

          {/* Modal: cabecera y pie fijos, con el formulario desplazándose entre
              ambos, para que "Guardar Cambios" esté siempre a la vista. */}
          <div
            className={`relative z-10 w-full max-w-2xl max-h-[85vh] rounded-xl border shadow-2xl flex flex-col animate-modal-panel transition-colors ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-between gap-4 px-6 py-4 border-b flex-shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 id="edit-work-title" className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Editar Publicación
              </h2>
              <button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Cerrar"
                className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Título de la obra"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Autor registrado <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>(opcional)</span>
                </label>
                <select
                  value={formData.authorProfileId}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorProfileId: e.target.value }))}
                  disabled={catalogAuthors.length === 0}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors disabled:opacity-60 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="">Sin asociar — firmar a mano</option>
                  {catalogAuthors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {catalogAuthors.length === 0
                    ? 'Todavía no hay autores en el catálogo, así que firma la obra a mano abajo.'
                    : 'Asóciala a una ficha del catálogo de autores y la obra contará en su página.'}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Autor de la obra
                </label>
                <input
                  type="text"
                  value={selectedProfile ? selectedProfile.name : formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  disabled={Boolean(selectedProfile)}
                  maxLength={120}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nombre del autor"
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {selectedProfile
                    ? `La firma la pone la ficha elegida: ${selectedProfile.name}. Vuelve a "Sin asociar" para escribirla a mano.`
                    : 'Con quién se firma la obra. Vacío la firma con tu nombre.'}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Género
                </label>
                {/* Desplegable y no texto libre: el servidor solo acepta los
                    géneros del catálogo y devuelve un 400 con cualquier otra
                    cosa, así que escribirlo a mano era una forma cómoda de que
                    el guardado fallara por una tilde o un plural. */}
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  {genresData.genres.map((genre) => (
                    <option key={genre.value} value={genre.value}>
                      {genre.emoji} {genre.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Descripción breve"
                  rows="3"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contenido
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Contenido de la obra"
                  rows="6"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Portada
                </label>

                <div className="flex items-start gap-4">
                  {/* En proporción 2:3, la misma con la que se ve en la
                      biblioteca. Antes era un `h-32` de ancho libre, que enseñaba
                      la imagen entera y no lo que de verdad se va a publicar. */}
                  {formData.cover ? (
                    <img
                      src={formData.cover}
                      alt="Portada actual de la obra"
                      className={`w-24 aspect-[2/3] object-cover rounded-md border shrink-0 ${
                        isDark ? 'border-gray-700' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <div className={`w-24 aspect-[2/3] rounded-md border border-dashed shrink-0 flex items-center justify-center text-center text-xs px-2 ${
                      isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-500'
                    }`}>
                      Sin portada
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* El input va oculto dentro de un `label` con aspecto de
                        botón. El control de archivo nativo se pinta con los
                        colores del sistema, que sobre el gris oscuro del modal
                        quedaban prácticamente ilegibles. */}
                    <label
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                        uploading.cover
                          ? 'opacity-60 cursor-wait'
                          : 'cursor-pointer'
                      } ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading.cover}
                        onChange={(e) => handleFileUpload(e, 'cover')}
                        className="sr-only"
                      />
                      {uploading.cover
                        ? 'Subiendo portada…'
                        : formData.cover ? 'Reemplazar portada' : 'Subir portada'}
                    </label>

                    {formData.cover && !uploading.cover && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cover: '' }))}
                        className={`ml-3 text-sm font-semibold transition-colors ${
                          isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Quitar
                      </button>
                    )}

                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Imagen de hasta 5 MB. Se recorta a proporción de portada de libro.
                      El cambio no se aplica hasta que guardes.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Archivo PDF
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                      uploading.pdf ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                    } ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      disabled={uploading.pdf}
                      onChange={(e) => handleFileUpload(e, 'pdf')}
                      className="sr-only"
                    />
                    {uploading.pdf
                      ? 'Subiendo archivo…'
                      : formData.pdfUrl ? 'Reemplazar PDF' : 'Subir PDF'}
                  </label>

                  {formData.pdfUrl && !uploading.pdf && (
                    <button
                      type="button"
                      onClick={() => setShowPdfPreview(!showPdfPreview)}
                      className="text-brand-700 hover:text-brand-800 hover:underline font-semibold text-sm"
                    >
                      {showPdfPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
                    </button>
                  )}
                </div>

                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {/* El `accept` decía ".pdf,.zip", pero el servidor rechaza todo
                      lo que no sea `application/pdf`: ofrecer ZIP solo servía
                      para que la subida fallase después de tragarse el archivo. */}
                  PDF de hasta 10 MB. El cambio no se aplica hasta que guardes.
                </p>
              </div>

              {showPdfPreview && formData.pdfUrl && (
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vista Previa del PDF
                  </label>
                  <PdfViewer url={formData.pdfUrl} isDark={isDark} />
                </div>
              )}
            </div>

            <div className={`flex gap-3 justify-end px-6 py-4 border-t flex-shrink-0 rounded-b-xl ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <button
                onClick={handleCancelEdit}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

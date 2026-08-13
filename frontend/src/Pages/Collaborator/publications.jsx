import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useNotify } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AreaSidebar from '../../components/AreaSidebar';
import PdfViewer from '../../components/PdfViewer';
import { getMyWorks, updateLiteraryWork, uploadPdf, uploadCover } from '../../services/api';

export default function Publications() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const notify = useNotify();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    content: '',
    pdfUrl: '',
    cover: '',
  });

  useEffect(() => {
    fetchPublications();
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
    if (!file) return;

    try {
      const uploadFn = type === 'pdf' ? uploadPdf : uploadCover;
      const url = await uploadFn(file);
      console.log(`✅ ${type} subido exitosamente. URL:`, url);

      setFormData(prev => {
        const newData = {
          ...prev,
          [type === 'pdf' ? 'pdfUrl' : 'cover']: url,
        };
        console.log(`✅ formData actualizado:`, newData);
        return newData;
      });
    } catch (err) {
      console.error(`❌ Error al subir ${type}:`, err);
      notify.error(`No se pudo subir ${type}: ${err.message}`);
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

  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { label: 'Publicado', color: isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' },
      pending_review: { label: 'Bajo revisión', color: isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rechazado', color: isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800' },
    };

    const info = statusMap[status] || { label: 'Borrador', color: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700' };
    return info;
  };

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
              <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-brand-700 text-white hover:bg-brand-800 whitespace-nowrap">
                📝 Nueva Publicación
              </button>
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
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
                              <td className={`px-6 py-4 text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {pub.title}
                              </td>
                              <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {pub.genre}
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
                                <button
                                  onClick={() => handleEditClick(pub)}
                                  className={`font-semibold transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                  Editar
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
                  Autor de la obra
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  maxLength={120}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nombre del autor"
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Con quién se firma la obra. Vacío la firma con tu nombre.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Género
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Género literario"
                />
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
                {formData.cover && (
                  <img src={formData.cover} alt="Portada" className="mb-3 h-32 rounded-lg" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Archivo PDF
                </label>
                {formData.pdfUrl && (
                  <div className="mb-3 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowPdfPreview(!showPdfPreview)}
                      className="text-brand-700 hover:underline font-semibold"
                    >
                      {showPdfPreview ? '🙈 Ocultar' : '👁️ Vista previa'} PDF
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.zip"
                  onChange={(e) => handleFileUpload(e, 'pdf')}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Soporta PDF y archivos ZIP
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

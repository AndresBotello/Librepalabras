import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Eye, FileText, Image as ImageIcon, Loader2, Pencil, Plus, Trash2, TrendingUp, X } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import {
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  createPoliversiaEdition,
  deletePoliversiaEdition,
  formatBytes,
  getPoliversiaEditions,
  updatePoliversiaEdition,
  uploadCoverWithProgress,
  uploadMagazinePdf,
} from '../../services/api';

const EMPTY_FORM = {
  edition: '',
  title: '',
  description: '',
  publishedAt: '',
  isPublished: true,
};

/** Misma validación que aplica el backend, para avisar antes de gastar la subida. */
function validatePdf(file) {
  if (!file) return 'Selecciona un archivo PDF.';
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)) {
    return 'El archivo debe ser un PDF.';
  }
  if (file.size > MAX_PDF_BYTES) {
    return `El PDF pesa ${formatBytes(file.size)} y el límite es ${formatBytes(MAX_PDF_BYTES)}.`;
  }
  return null;
}

function validateImage(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) return 'La portada debe ser una imagen.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `La portada pesa ${formatBytes(file.size)} y el límite es ${formatBytes(MAX_IMAGE_BYTES)}.`;
  }
  return null;
}

export default function AdminPoliversia() {
  const { isDark } = useContext(ThemeContext);
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [confirmation, setConfirmation] = useState(null);

  const pdfInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const editing = useMemo(
    () => editions.find((item) => item.id === editingId) || null,
    [editions, editingId]
  );

  // Las lecturas solo se acumulan en ediciones públicas, así que el resumen
  // ignora los borradores para no dar un total engañoso.
  const readingStats = useMemo(() => {
    const published = editions.filter((item) => item.isPublished !== false);

    return {
      publishedCount: published.length,
      totalViews: published.reduce((sum, item) => sum + (item.views || 0), 0),
      mostRead: published.reduce(
        (best, item) => ((item.views || 0) > (best?.views || 0) ? item : best),
        null
      ),
    };
  }, [editions]);

  // Recarga desde manejadores de eventos (tras crear, editar o eliminar).
  const loadEditions = async () => {
    try {
      const response = await getPoliversiaEditions({ includeDrafts: true });
      setEditions(response.editions || []);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // La carga inicial va aparte para no llamar a setState de forma síncrona
  // dentro del efecto, y para no escribir estado si se desmonta antes.
  useEffect(() => {
    let active = true;

    getPoliversiaEditions({ includeDrafts: true })
      .then((response) => {
        if (active) setEditions(response.editions || []);
      })
      .catch((error) => {
        if (active) setStatus({ type: 'error', message: error.message });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPdfFile(null);
    setCoverFile(null);
    setPdfProgress(0);
    setCoverProgress(0);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const openCreate = () => {
    closeForm();
    setIsFormOpen(true);
  };

  const openEdit = (edition) => {
    closeForm();
    setEditingId(edition.id);
    setForm({
      edition: String(edition.edition ?? ''),
      title: edition.title || '',
      description: edition.description || '',
      publishedAt: (edition.publishedAt || '').slice(0, 10),
      isPublished: edition.isPublished !== false,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!form.edition || !form.title.trim() || !form.publishedAt) {
      setStatus({ type: 'error', message: 'Número de edición, título y fecha son obligatorios.' });
      return;
    }

    // Al crear, el PDF es obligatorio; al editar, solo si se va a reemplazar.
    if (!editingId) {
      const pdfError = validatePdf(pdfFile);
      if (pdfError) {
        setStatus({ type: 'error', message: pdfError });
        return;
      }
    } else if (pdfFile) {
      const pdfError = validatePdf(pdfFile);
      if (pdfError) {
        setStatus({ type: 'error', message: pdfError });
        return;
      }
    }

    const coverError = validateImage(coverFile);
    if (coverError) {
      setStatus({ type: 'error', message: coverError });
      return;
    }

    // Reemplazar el PDF de una edición viva se confirma antes de subir nada.
    if (editingId && pdfFile && !confirmation) {
      setConfirmation({
        type: 'replace',
        title: 'Reemplazar el PDF de esta edición',
        message: `El PDF actual de la edición N.º ${editing?.edition} se sustituirá por "${pdfFile.name}" y se borrará de Cloudinary. El número, el título, la fecha y las visitas se conservan.`,
        confirmLabel: 'Sí, reemplazar PDF',
        onConfirm: () => {
          setConfirmation(null);
          submitEdition();
        },
      });
      return;
    }

    submitEdition();
  };

  const submitEdition = async () => {
    setSubmitting(true);
    setStatus(null);

    try {
      const payload = {
        edition: Number(form.edition),
        title: form.title.trim(),
        description: form.description.trim(),
        publishedAt: form.publishedAt,
        isPublished: form.isPublished,
      };

      if (pdfFile) {
        setPdfProgress(0);
        const uploaded = await uploadMagazinePdf(pdfFile, setPdfProgress);
        payload.pdfUrl = uploaded.url;
        payload.pdfPublicId = uploaded.publicId;
        payload.pdfSize = uploaded.size;
        payload.pdfFileName = uploaded.fileName;
      }

      if (coverFile) {
        setCoverProgress(0);
        const uploaded = await uploadCoverWithProgress(coverFile, setCoverProgress);
        payload.coverUrl = uploaded.url;
        payload.coverPublicId = uploaded.publicId;
      }

      if (editingId) {
        await updatePoliversiaEdition(editingId, payload);
        setStatus({ type: 'success', message: 'Edición actualizada correctamente.' });
      } else {
        await createPoliversiaEdition(payload);
        setStatus({ type: 'success', message: 'Edición publicada correctamente.' });
      }

      closeForm();
      await loadEditions();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
      setPdfProgress(0);
      setCoverProgress(0);
    }
  };

  const requestDelete = (edition) => {
    setConfirmation({
      type: 'delete',
      title: `Eliminar la edición N.º ${edition.edition}`,
      message: `Se borrarán definitivamente el registro, el PDF y la portada de "${edition.title}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        setConfirmation(null);
        try {
          await deletePoliversiaEdition(edition.id);
          setStatus({ type: 'success', message: 'Edición eliminada correctamente.' });
          await loadEditions();
        } catch (error) {
          setStatus({ type: 'error', message: error.message });
        }
      },
    });
  };

  const inputClasses = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-[#5D4037]/20 focus:border-[#5D4037]'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 tracking-wider uppercase ${
    isDark ? 'text-gray-300' : 'text-[#5D4037]'
  }`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <main className="flex-1 px-4 sm:px-8 py-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
                  Revista Poleversia
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Publica nuevas ediciones o reemplaza el PDF de una existente.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5D4037] hover:bg-[#4A302A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva edición
              </button>
            </div>

            {status && (
              <div className={`mb-6 rounded-xl px-4 py-3 text-sm border ${
                status.type === 'success'
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {status.message}
              </div>
            )}

            {/* Lecturas: se suma una cada vez que alguien abre una edición en el
                catálogo público. */}
            {!loading && editions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatTile
                  isDark={isDark}
                  icon={Eye}
                  label="Lecturas totales"
                  value={readingStats.totalViews.toLocaleString('es-CO')}
                  hint="Aperturas en el catálogo público"
                />
                <StatTile
                  isDark={isDark}
                  icon={BookOpen}
                  label="Ediciones publicadas"
                  value={readingStats.publishedCount}
                  hint={`${editions.length - readingStats.publishedCount} en borrador`}
                />
                <StatTile
                  isDark={isDark}
                  icon={TrendingUp}
                  label="Edición más leída"
                  value={readingStats.mostRead ? `N.º ${readingStats.mostRead.edition}` : '—'}
                  hint={
                    readingStats.mostRead
                      ? `${(readingStats.mostRead.views || 0).toLocaleString('es-CO')} lecturas · ${readingStats.mostRead.title}`
                      : 'Aún sin lecturas'
                  }
                />
              </div>
            )}

            {/* Formulario */}
            {isFormOpen && (
              <form
                onSubmit={handleSubmit}
                className={`mb-8 rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
                    {editingId ? `Editar edición N.º ${editing?.edition}` : 'Nueva edición'}
                  </h2>
                  <button type="button" onClick={closeForm} className={isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelClasses}>N.º de edición</label>
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      value={form.edition}
                      onChange={(e) => setForm({ ...form, edition: e.target.value })}
                      className={inputClasses}
                      placeholder="7"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClasses}>Título / tema</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className={inputClasses}
                      placeholder="Memoria y territorio"
                      maxLength={140}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className={labelClasses}>Fecha de publicación</label>
                  <input
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div className="mb-4">
                  <label className={labelClasses}>Descripción (opcional)</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputClasses}
                    placeholder="Breve reseña del contenido de esta edición."
                    maxLength={800}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelClasses}>
                      <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                      Portada {editingId && '(dejar vacío para conservar)'}
                    </label>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className={`${inputClasses} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#5D4037] file:text-white`}
                    />
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Imagen, máx. {formatBytes(MAX_IMAGE_BYTES)}
                    </p>
                  </div>

                  <div>
                    <label className={labelClasses}>
                      <FileText className="w-3.5 h-3.5 inline mr-1" />
                      PDF {editingId && '(dejar vacío para conservar)'}
                    </label>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className={`${inputClasses} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#5D4037] file:text-white`}
                    />
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Solo PDF, máx. {formatBytes(MAX_PDF_BYTES)}
                    </p>
                  </div>
                </div>

                {/* Progreso de subida */}
                {submitting && (pdfFile || coverFile) && (
                  <div className="space-y-3 mb-4">
                    {coverFile && (
                      <ProgressBar label="Portada" value={coverProgress} isDark={isDark} />
                    )}
                    {pdfFile && (
                      <ProgressBar label={`PDF (${formatBytes(pdfFile.size)})`} value={pdfProgress} isDark={isDark} />
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#5D4037] focus:ring-[#5D4037]"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Visible en el catálogo público
                  </span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5D4037] hover:bg-[#4A302A] disabled:opacity-50 transition-colors"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Subiendo…' : editingId ? 'Guardar cambios' : 'Publicar edición'}
                  </button>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                      isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Listado */}
            {loading ? (
              <div className={`flex items-center justify-center gap-3 py-20 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando ediciones…
              </div>
            ) : editions.length === 0 ? (
              <div className={`rounded-2xl border border-dashed px-6 py-16 text-center text-sm ${
                isDark ? 'border-gray-800 text-gray-400' : 'border-gray-300 text-gray-600'
              }`}>
                Aún no hay ediciones. Crea la primera con «Nueva edición».
              </div>
            ) : (
              <div className="space-y-3">
                {editions.map((edition) => (
                  <div
                    key={edition.id}
                    className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
                      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      {edition.coverUrl ? (
                        <img src={edition.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className={`w-5 h-5 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-[#5D4037]'}`}>
                          N.º {edition.edition}
                        </span>
                        {!edition.isPublished && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                            Borrador
                          </span>
                        )}
                        <span
                          title={`${edition.views || 0} lecturas registradas`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDark ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          {(edition.views || 0).toLocaleString('es-CO')} {(edition.views || 0) === 1 ? 'lectura' : 'lecturas'}
                        </span>
                      </div>
                      <p className={`font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {edition.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {(edition.publishedAt || '').slice(0, 10)}
                        {edition.pdfSize ? ` · ${formatBytes(edition.pdfSize)}` : ''}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(edition)}
                        className={`p-2.5 rounded-lg transition-colors ${
                          isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label={`Editar edición ${edition.edition}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => requestDelete(edition)}
                        className={`p-2.5 rounded-lg transition-colors ${
                          isDark ? 'bg-rose-950/50 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                        aria-label={`Eliminar edición ${edition.edition}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
          </div>
        </main>
      </div>

      <Footer />

      {confirmation && (
        <ConfirmDialog
          isDark={isDark}
          {...confirmation}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}

function StatTile({ isDark, icon: Icon, label, value, hint }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-[#5D4037]'}`} />
        <span className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
        {value}
      </p>
      {hint && (
        <p className={`text-xs mt-1 truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`} title={hint}>
          {hint}
        </p>
      )}
    </div>
  );
}

function ProgressBar({ label, value, isDark }) {
  return (
    <div>
      <div className={`flex justify-between text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div
          className="h-full bg-[#5D4037] transition-all duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ConfirmDialog({ isDark, title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full flex-shrink-0 ${isDark ? 'bg-amber-950/50' : 'bg-amber-50'}`}>
            <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

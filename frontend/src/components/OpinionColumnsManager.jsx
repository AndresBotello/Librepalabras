import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { richEditorHandlers } from '../utils/richPaste';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  createOpinionColumn,
  getOpinionColumnById,
  updateOpinionColumn,
  uploadCover,
} from '../services/api';
import { STATUS_OPTIONS } from '../utils/opinionColumnStatus';

// `status` vacío significa "el de por defecto según el rol" (ver `defaultStatus`):
// un administrador no necesita que nadie le revise la columna, así que arranca en
// "publicada" (sigue pudiendo elegir borrador). El resto, en borrador. Se resuelve
// al usarlo porque el rol puede llegar después del primer render.
const defaultStatus = (isAdmin) => (isAdmin ? 'published' : 'draft');

const buildEmptyForm = () => ({
  title: '',
  subtitle: '',
  author: '',
  coverUrl: '',
  content: '',
  status: '',
  publishedAt: '',
});

/**
 * Del instante guardado al "yyyy-MM-dd" que es lo ÚNICO que acepta
 * `<input type="date">`. Pasarle el ISO completo hace que el navegador lo
 * rechace y deje el campo en blanco, así que al editar una columna publicada no
 * se veía su fecha.
 *
 * Se parte en trozos de hora local, no UTC, para que coincida con la fecha que
 * el resto de la pantalla muestra con `toLocaleDateString`.
 */
function toDateInputValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * El camino de vuelta. `new Date('2026-08-15')` se interpreta como medianoche
 * UTC, que en Colombia es el día 14 por la tarde: guardar sin tocar nada movería
 * la fecha un día hacia atrás en cada edición. Con la hora pegada al texto se
 * interpreta como medianoche local y el viaje de ida y vuelta es estable.
 */
function fromDateInputValue(value) {
  if (!value) return '';

  // Si no tiene la forma del campo, ya es un instante completo: se deja pasar.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function stripHtml(text = '') {
  return String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function OpinionColumnsManager() {
  const { user } = useAuth();
  const { isDark } = useContext(ThemeContext);
  const isAdmin = user?.role === 'admin';
  const editorRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('editar');
  const listPath = `${isAdmin ? '/admin' : '/collaborator'}/columnas/lista`;
  const [loadingColumn, setLoadingColumn] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(buildEmptyForm);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState('');

  // La columna a editar llega por la dirección (?editar=id): así el botón
  // "Editar" de la lista funciona como un enlace y la página se puede recargar.
  useEffect(() => {
    if (!editingId) return undefined;

    let cancelled = false;

    getOpinionColumnById(editingId)
      .then((response) => {
        if (cancelled) return;
        const column = response.column;
        setForm({
          title: column.title || '',
          subtitle: column.subtitle || '',
          author: column.author || user?.name || '',
          coverUrl: column.coverUrl || '',
          content: column.content || '',
          status: column.status || 'draft',
          publishedAt: toDateInputValue(column.publishedAt),
        });
        setCoverPreview(column.coverUrl || '');
        setError('');
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'No se pudo cargar la columna');
      })
      .finally(() => {
        if (!cancelled) setLoadingColumn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editingId]);

  useEffect(() => {
    if (!editorRef.current) return;

    const editorValue = editorRef.current.innerHTML || '';
    if (editorValue !== (form.content || '')) {
      editorRef.current.innerHTML = form.content || '';
    }
  }, [form.content]);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const handleEditorInput = (event) => {
    const nextContent = event?.currentTarget?.innerHTML ?? '';
    setForm((previous) => ({ ...previous, content: nextContent }));
  };

  const applyFormatting = (command, value = null) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, value);
    setForm((previous) => ({ ...previous, content: editor.innerHTML || '' }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (coverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }

    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);
    setSuccess('Vista previa de la portada actualizada');
    setError('');

    try {
      setUploadingCover(true);
      const remoteUrl = await uploadCover(file);
      setForm((previous) => ({ ...previous, coverUrl: remoteUrl }));
      setCoverPreview(remoteUrl || localPreview);
      setSuccess(remoteUrl ? 'Portada cargada correctamente' : 'Vista previa actualizada');
      setError('');
    } catch (uploadError) {
      setError(uploadError.message || 'No se pudo subir la portada');
      setCoverPreview(localPreview);
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (!stripHtml(form.content).length) {
      setError('El contenido es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        author: form.author || user?.name || user?.email || 'Anónimo',
        status: isAdmin ? (form.status || defaultStatus(true)) : form.status === 'published' ? 'draft' : (form.status || 'draft'),
        coverUrl: form.coverUrl || '',
        publishedAt: fromDateInputValue(form.publishedAt),
      };

      if (editingId) {
        await updateOpinionColumn(editingId, payload);
        navigate(listPath);
        return;
      }

      await createOpinionColumn(payload);
      setSuccess('Columna creada correctamente');
      setForm(buildEmptyForm());
      setCoverPreview('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(submitError.message || 'No se pudo guardar la columna');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="mx-auto max-w-4xl">
        <section className={`rounded-3xl border p-6 shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>Editorial</p>
              <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {editingId ? 'Editar columna' : 'Crear columna de opinión'}
              </h2>
            </div>
            <Link
              to={listPath}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              {editingId ? 'Cancelar' : 'Ver columnas creadas'}
            </Link>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {loadingColumn && (
            <div className={`mb-5 rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              Cargando columna...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2 block">
                <span className={`mb-2 block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Título</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-amber-400 focus:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'}`}
                  placeholder="La nueva voz del periodismo local"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className={`mb-2 block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Subtítulo</span>
                <input
                  value={form.subtitle}
                  onChange={(event) => setForm((previous) => ({ ...previous, subtitle: event.target.value }))}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-amber-400 focus:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'}`}
                  placeholder="Introducción breve que acompañe al titular"
                />
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Autor</span>
                <input
                  value={form.author}
                  onChange={(event) => setForm((previous) => ({ ...previous, author: event.target.value }))}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-amber-400 focus:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'}`}
                  placeholder="Nombre del autor"
                />
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Fecha de publicación</span>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(event) => setForm((previous) => ({ ...previous, publishedAt: event.target.value }))}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-amber-400 focus:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'}`}
                />
              </label>
            </div>

            <div className={`rounded-2xl border border-dashed p-4 ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-50'}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Imagen de portada</span>
                <label className="cursor-pointer rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800">
                  {uploadingCover ? 'Subiendo...' : 'Seleccionar imagen'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              {coverPreview || form.coverUrl ? (
                <div className="space-y-2">
                  <img src={coverPreview || form.coverUrl} alt="Portada de la columna" className="h-48 w-full rounded-2xl object-cover" />
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Previsualización actual de la portada</p>
                </div>
              ) : (
                <div className={`flex h-48 items-center justify-center rounded-2xl border border-dashed text-sm ${isDark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                  Sin imagen de portada (opcional)
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => applyFormatting('bold')} className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>Negrita</button>
                <button type="button" onClick={() => applyFormatting('italic')} className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>Cursiva</button>
                <button type="button" onClick={() => applyFormatting('insertUnorderedList')} className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>Lista</button>
                <button type="button" onClick={() => applyFormatting('formatBlock', 'h3')} className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>Título</button>
                <button type="button" onClick={() => applyFormatting('formatBlock', 'blockquote')} className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>Cita</button>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
          {...richEditorHandlers((html) => setForm((previous) => ({ ...previous, content: html })))}
                className={`min-h-[220px] rounded-2xl border px-4 py-3 shadow-inner outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-amber-400 focus:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white'}`}
                data-placeholder="Escribe tu columna aquí..."
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Estado</span>
                <select
                  value={form.status || defaultStatus(isAdmin)}
                  onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-amber-400' : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500'}`}
                  disabled={!isAdmin && form.status === 'published'}
                >
                  {STATUS_OPTIONS.filter((option) => {
                    if (isAdmin) return true;
                    return ['draft', 'pending_review'].includes(option.value);
                  }).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={saving || loadingColumn}
                className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar columna'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}

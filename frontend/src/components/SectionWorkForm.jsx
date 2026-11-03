import { useEffect, useRef, useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { MAX_IMAGE_BYTES, createSectionWork, formatBytes, updateSectionWork, uploadCover } from '../services/api';

const MIN_CHILD_AGE = 3;
const MAX_CHILD_AGE = 17;

const EMPTY_FORM = {
  kind: '',
  title: '',
  content: '',
  description: '',
  childName: '',
  childAge: '',
  guardianConsent: false,
  author: '',
  municipality: '',
};

/** Los valores del formulario a partir de una obra ya guardada (modo edición). */
function formFromWork(work) {
  return {
    kind: work.kind || '',
    title: work.title || '',
    content: work.content || '',
    description: work.description || '',
    // En "Los niños cuentan" la firma de la obra es el nombre del niño.
    childName: work.author || '',
    childAge: work.childAge ? String(work.childAge) : '',
    guardianConsent: work.guardianConsent === true,
    author: work.author || '',
    municipality: work.municipality || '',
  };
}

/**
 * Formulario de publicación de las secciones especiales. La misma pantalla
 * sirve a las dos: los campos propios de cada una (niño y autorización / firma y
 * municipio) salen según `section.value`. Quién puede enviarlo lo decide el
 * servidor; aquí solo se evita ofrecerlo a quien no podría.
 *
 * Con `work` se usa para editar esa obra: parte de sus valores y guarda los
 * cambios en lugar de crear una nueva.
 */
export default function SectionWorkForm({ section, isDark, onSuccess, work = null }) {
  const isEditing = Boolean(work);
  const [form, setForm] = useState(() => (work ? formFromWork(work) : EMPTY_FORM));
  // La imagen que la obra ya tiene guardada. Se conserva salvo que se quite o se
  // suba otra.
  const [savedCover, setSavedCover] = useState(work?.cover || null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef(null);

  const isChildren = section.value === 'ninos';
  const kind = section.kinds.find((item) => item.value === form.kind);

  const labelClass = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const inputClass = `w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-gray-400'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-500'
  }`;
  const hintClass = `text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`;

  // La vista previa es una URL local que no se libera sola: se revoca al
  // cambiar de imagen, al quitarla y al salir del formulario.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG, GIF o WEBP)');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(`La imagen no puede pesar más de ${formatBytes(MAX_IMAGE_BYTES)}`);
      return;
    }

    setError('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setPreview('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeImage = () => {
    clearImage();
    setSavedCover(null);
  };

  const validate = () => {
    if (!kind) return 'Elige el tipo de aporte';
    if (!form.title.trim()) return 'El título es obligatorio';
    if (kind.imageRequired && !image && !savedCover) return 'Sube la imagen del dibujo';

    if (isChildren) {
      const age = Number(form.childAge);
      if (form.childName.trim().length < 2) return 'Escribe el nombre del niño o niña';
      if (!Number.isInteger(age) || age < MIN_CHILD_AGE || age > MAX_CHILD_AGE) {
        return `La edad debe estar entre ${MIN_CHILD_AGE} y ${MAX_CHILD_AGE} años`;
      }
      if (!form.guardianConsent) return 'Confirma que el acudiente autorizó la publicación';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const cover = image ? await uploadCover(image) : savedCover;

      const payload = {
        kind: form.kind,
        title: form.title,
        content: form.content,
        description: form.description,
        cover,
        ...(isChildren
          ? {
              childName: form.childName,
              childAge: Number(form.childAge),
              guardianConsent: form.guardianConsent,
            }
          : { author: form.author, municipality: form.municipality }),
      };

      const response = isEditing
        ? await updateSectionWork(section.value, work.id, payload)
        : await createSectionWork(section.value, payload);

      if (!isEditing) {
        setForm(EMPTY_FORM);
        clearImage();
      }

      onSuccess?.(response);
    } catch (err) {
      setError(err.message || 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div role="alert" className={`p-3 rounded-lg text-sm ${isDark ? 'bg-red-900/40 text-red-200' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      <fieldset>
        <legend className={labelClass}>Tipo de aporte *</legend>
        <div className="flex flex-wrap gap-2">
          {section.kinds.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={form.kind === item.value}
              onClick={() => setField('kind', item.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                form.kind === item.value
                  ? 'bg-amber-500 border-amber-500 text-stone-950'
                  : isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="section-title" className={labelClass}>Título *</label>
        <input
          id="section-title"
          type="text"
          value={form.title}
          maxLength={150}
          onChange={(e) => setField('title', e.target.value)}
          className={inputClass}
        />
      </div>

      {isChildren ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="child-name" className={labelClass}>Nombre del niño o niña *</label>
              <input
                id="child-name"
                type="text"
                value={form.childName}
                maxLength={60}
                autoComplete="off"
                onChange={(e) => setField('childName', e.target.value)}
                className={inputClass}
              />
              <p className={hintClass}>Solo el nombre de pila: no escribas apellidos ni datos de contacto.</p>
            </div>
            <div>
              <label htmlFor="child-age" className={labelClass}>Edad *</label>
              <input
                id="child-age"
                type="number"
                min={MIN_CHILD_AGE}
                max={MAX_CHILD_AGE}
                value={form.childAge}
                onChange={(e) => setField('childAge', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <label className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={form.guardianConsent}
              onChange={(e) => setField('guardianConsent', e.target.checked)}
              className="mt-1"
            />
            <span>
              Cuento con la autorización escrita de la madre, el padre o el acudiente legal para
              publicar este aporte con el nombre de pila y la edad del niño o niña. *
            </span>
          </label>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="section-author" className={labelClass}>Firma</label>
            <input
              id="section-author"
              type="text"
              value={form.author}
              maxLength={120}
              onChange={(e) => setField('author', e.target.value)}
              placeholder="Nombre, seudónimo o “Anónimo”"
              className={inputClass}
            />
            <p className={hintClass}>Si la dejas vacía, se firma con el nombre de tu cuenta.</p>
          </div>
          <div>
            <label htmlFor="section-municipality" className={labelClass}>Municipio o lugar</label>
            <input
              id="section-municipality"
              type="text"
              value={form.municipality}
              maxLength={80}
              onChange={(e) => setField('municipality', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="section-image" className={labelClass}>
          {kind?.imageRequired ? 'Imagen del dibujo *' : 'Imagen (opcional)'}
        </label>
        <input
          id="section-image"
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImage}
          className={`block w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
        />
        <p className={hintClass}>JPG, PNG, GIF o WEBP, hasta {formatBytes(MAX_IMAGE_BYTES)}.</p>
        {(preview || savedCover) && (
          <div className="mt-3 flex items-start gap-3">
            <img src={preview || savedCover} alt="Vista previa" className="max-h-48 rounded-lg border border-stone-500/30" />
            <button type="button" onClick={removeImage} className="text-sm text-red-500 hover:underline">
              Quitar
            </button>
          </div>
        )}
      </div>

      <div>
        <span className={labelClass}>Descripción (opcional)</span>
        <RichTextEditor
          value={form.description}
          onChange={(html) => setField('description', html)}
          isDark={isDark}
          minHeightClass="min-h-24"
          placeholder="Una introducción o contexto del aporte…"
        />
      </div>

      <div>
        <span className={labelClass}>{kind?.imageRequired ? 'Texto (opcional)' : 'Texto *'}</span>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setField('content', html)}
          isDark={isDark}
          placeholder="Escribe aquí el texto…"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-3 rounded-lg font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Publicar'}
      </button>
    </form>
  );
}

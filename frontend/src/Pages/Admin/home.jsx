import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import {
  getApprovedWorks,
  getHomeContent,
  updateHomeContent,
  uploadCoverWithProgress,
} from '../../services/api';
import { isoToLocalInput, localInputToIso } from '../../utils/datetime';

const MAX_FEATURED = 6;
const MAX_EVENTS = 6;
// Mismo tope que valida el servidor en siteConfig.service.js.
const MAX_POPUPS = 6;
// El mismo tope que aplica el servidor en siteConfig.service.js: así el
// contador dice la verdad y el recorte no sorprende al guardar.
const MAX_EDITORIAL_BODY = 20000;

// Las mismas claves que valida el servidor en siteConfig.service.js.
const EDITORIAL_FONTS = [
  { value: 'serif', label: 'Serif clásica' },
  { value: 'display', label: 'Playfair Display' },
  { value: 'sans', label: 'Lato' },
];

// Cada parte del escrito puede llevar su propia letra. Vacío = la general, que
// es lo que permite cambiar el bloque entero desde un solo desplegable en vez
// de tener que repetir la elección cuatro veces.
const EDITORIAL_FONT_SECTIONS = [
  { field: 'editorialTitleFont', label: 'Título' },
  { field: 'editorialEpigraphFont', label: 'Epígrafe' },
  { field: 'editorialBodyFont', label: 'Cuerpo' },
  { field: 'editorialSignatureFont', label: 'Firma' },
];

const EMPTY_EVENT = { title: '', link: '', date: '', place: '', description: '' };

/**
 * Los eventos se editan con la fecha en formato `datetime-local` y se guardan
 * en ISO. La traducción se hace al entrar y al salir para que el resto del
 * formulario no tenga que pensar en zonas horarias.
 */
function eventsForEditing(events) {
  if (!Array.isArray(events)) return [];

  return events.map((event) => ({
    ...EMPTY_EVENT,
    ...event,
    date: isoToLocalInput(event.date),
  }));
}

function eventsForSaving(events = []) {
  return events.map((event) => ({
    ...event,
    date: localInputToIso(event.date),
  }));
}

/**
 * Id de la fila, para que `key` sea estable y reordenar no remonte los campos
 * de texto (que es como se pierde el foco mientras se escribe).
 *
 * `crypto.randomUUID` solo existe en contexto seguro: en localhost y en https
 * está, pero al abrir el panel por la IP de la red local (`vite --host`, para
 * probar desde el móvil) es `undefined` y añadir un evento reventaba sin
 * mostrar nada. El id no es un secreto ni viaja a ninguna parte: cualquier
 * valor único sirve.
 */
/** Mismo criterio que usa la portada para dejar de anunciar un evento. */
function isPastEvent(event) {
  if (!event.date) return false;

  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) return false;

  date.setHours(23, 59, 59, 999);
  return date < new Date();
}

function newRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AdminHome() {
  const { isDark } = useContext(ThemeContext);

  const [content, setContent] = useState(null);
  const [saved, setSaved] = useState(null);
  const [works, setWorks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [popupUploadProgress, setPopupUploadProgress] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const [homeRes, worksRes] = await Promise.all([
        getHomeContent(),
        getApprovedWorks(),
      ]);

      if (homeRes.ok) {
        // `featuredWorks` viene resuelto por el backend, pero para editar solo
        // hacen falta los ids: es lo único que se guarda.
        const { featuredWorks, ...editable } = homeRes.home;
        const prepared = { ...editable, events: eventsForEditing(editable.events) };

        setContent(prepared);
        setSaved(prepared);
      }

      if (worksRes.ok) {
        setWorks(worksRes.works || []);
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  };

  const toggleFeatured = (workId) => {
    setContent((prev) => {
      const current = prev.featuredWorkIds || [];

      if (current.includes(workId)) {
        return { ...prev, featuredWorkIds: current.filter((id) => id !== workId) };
      }

      if (current.length >= MAX_FEATURED) {
        setFeedback({ type: 'error', text: `Solo puedes destacar ${MAX_FEATURED} obras.` });
        return prev;
      }

      return { ...prev, featuredWorkIds: [...current, workId] };
    });

    setFeedback(null);
  };

  const moveFeatured = (index, direction) => {
    setContent((prev) => {
      const ids = [...(prev.featuredWorkIds || [])];
      const target = index + direction;

      if (target < 0 || target >= ids.length) return prev;

      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { ...prev, featuredWorkIds: ids };
    });
  };

  const addEvent = () => {
    setContent((prev) => ({
      ...prev,
      events: [...(prev.events || []), { ...EMPTY_EVENT, id: newRowId() }],
    }));
    setFeedback(null);
  };

  const updateEvent = (id, key, value) => {
    setContent((prev) => ({
      ...prev,
      events: (prev.events || []).map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
    setFeedback(null);
  };

  const removeEvent = (id) => {
    setContent((prev) => ({
      ...prev,
      events: (prev.events || []).filter((item) => item.id !== id),
    }));
    setFeedback(null);
  };

  const moveEvent = (index, direction) => {
    setContent((prev) => {
      const list = [...(prev.events || [])];
      const target = index + direction;

      if (target < 0 || target >= list.length) return prev;

      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, events: list };
    });
  };

  /**
   * A diferencia de un evento, una invitación no tiene sentido sin imagen: se
   * crea la fila y se sube la imagen en el mismo paso, en vez de dejar un
   * hueco que el admin tendría que rellenar después.
   */
  const handlePopupUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const current = content?.popups || [];

    if (current.length >= MAX_POPUPS) {
      setFeedback({ type: 'error', text: `Solo puedes añadir ${MAX_POPUPS} imágenes.` });
      event.target.value = '';
      return;
    }

    setPopupUploadProgress(0);
    setFeedback(null);

    try {
      const response = await uploadCoverWithProgress(file, setPopupUploadProgress);

      setContent((prev) => ({
        ...prev,
        popups: [...(prev.popups || []), { id: newRowId(), imageUrl: response.url, link: '', alt: '' }],
      }));

      setFeedback({ type: 'success', text: 'Imagen añadida. Recuerda guardar los cambios.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setPopupUploadProgress(null);
      event.target.value = '';
    }
  };

  const updatePopup = (id, key, value) => {
    setContent((prev) => ({
      ...prev,
      popups: (prev.popups || []).map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
    setFeedback(null);
  };

  const removePopup = (id) => {
    setContent((prev) => ({
      ...prev,
      popups: (prev.popups || []).filter((item) => item.id !== id),
    }));
    setFeedback(null);
  };

  const movePopup = (index, direction) => {
    setContent((prev) => {
      const list = [...(prev.popups || [])];
      const target = index + direction;

      if (target < 0 || target >= list.length) return prev;

      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, popups: list };
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    setFeedback(null);

    try {
      const response = await uploadCoverWithProgress(file, setUploadProgress);
      handleChange('heroImage', response.url);
      setFeedback({ type: 'success', text: 'Imagen subida. Recuerda guardar los cambios.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setUploadProgress(null);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const response = await updateHomeContent({
        ...content,
        events: eventsForSaving(content.events),
      });
      const { featuredWorks, ...editable } = response.home;
      const prepared = { ...editable, events: eventsForEditing(editable.events) };

      setContent(prepared);
      setSaved(prepared);
      setFeedback({ type: 'success', text: response.message });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const events = content?.events || [];
  const popups = content?.popups || [];
  const featuredIds = content?.featuredWorkIds || [];

  const featuredWorks = useMemo(
    () => featuredIds.map((id) => works.find((work) => work.id === id)).filter(Boolean),
    [featuredIds, works]
  );

  const filteredWorks = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return works.slice(0, 40);

    return works
      .filter((work) =>
        work.title?.toLowerCase().includes(term) || work.author?.toLowerCase().includes(term)
      )
      .slice(0, 40);
  }, [works, search]);

  const isDirty = saved && content && JSON.stringify(saved) !== JSON.stringify(content);

  const cardClass = `rounded-xl border p-6 transition-colors ${
    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
  }`;

  const inputClass = `w-full px-4 py-2 rounded-lg transition-colors ${
    isDark
      ? 'bg-slate-800 text-slate-100 border border-slate-700 focus:border-amber-500'
      : 'bg-white text-slate-900 border border-slate-300 focus:border-amber-600'
  } focus:outline-none`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className={`px-6 lg:px-10 py-8 border-b transition-colors ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                  Contenido
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                  Gestión de la portada
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Edita el banner y elige qué obras se destacan, sin tocar código.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isDirty && (
                  <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    Cambios sin guardar
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="px-5 py-2 rounded-lg font-semibold text-sm bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8 space-y-8">
            {feedback && (
              <div
                role="status"
                className={`px-4 py-3 rounded-lg text-sm font-medium ${
                  feedback.type === 'success'
                    ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                    : isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {loading || !content ? (
              <div className="space-y-6">
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className={`h-64 rounded-xl border animate-pulse ${cardClass}`} />
                ))}
              </div>
            ) : (
              <>
                {/* Banner principal */}
                <section className={cardClass}>
                  <h2 className="text-lg font-bold mb-1">Banner principal</h2>
                  <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Lo primero que ve quien entra al sitio.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label htmlFor="heroTitle" className={labelClass}>Título</label>
                      <input
                        id="heroTitle"
                        type="text"
                        maxLength={120}
                        value={content.heroTitle || ''}
                        onChange={(e) => handleChange('heroTitle', e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="heroSubtitle" className={labelClass}>Subtítulo</label>
                      <textarea
                        id="heroSubtitle"
                        rows={2}
                        maxLength={300}
                        value={content.heroSubtitle || ''}
                        onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="heroCtaLabel" className={labelClass}>Texto del botón</label>
                        <input
                          id="heroCtaLabel"
                          type="text"
                          maxLength={40}
                          value={content.heroCtaLabel || ''}
                          onChange={(e) => handleChange('heroCtaLabel', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="heroCtaLink" className={labelClass}>Destino del botón</label>
                        <input
                          id="heroCtaLink"
                          type="text"
                          placeholder="/stories"
                          value={content.heroCtaLink || ''}
                          onChange={(e) => handleChange('heroCtaLink', e.target.value)}
                          className={inputClass}
                        />
                        <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          Ruta interna, debe empezar por «/».
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className={labelClass}>Imagen de fondo</span>

                      {content.heroImage && (
                        <img
                          src={content.heroImage}
                          alt="Vista previa del banner"
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <label className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                          isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}>
                          {content.heroImage ? 'Cambiar imagen' : 'Subir imagen'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>

                        {content.heroImage && (
                          <button
                            onClick={() => handleChange('heroImage', '')}
                            className={`text-sm ${isDark ? 'text-rose-400' : 'text-rose-600'} hover:underline`}
                          >
                            Quitar imagen
                          </button>
                        )}

                        {uploadProgress !== null && (
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Subiendo… {uploadProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Aviso en portada */}
                <section className={cardClass}>
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                      <h2 className="text-lg font-bold mb-1">Aviso en portada</h2>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Franja informativa sobre el banner. Útil para convocatorias o cierres temporales.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(content.announcementActive)}
                      aria-label="Mostrar aviso en portada"
                      onClick={() => handleChange('announcementActive', !content.announcementActive)}
                      className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${
                        content.announcementActive ? 'bg-brand-700' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        content.announcementActive ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="Ej.: Convocatoria de cuento corto abierta hasta el 30 de septiembre."
                    value={content.announcementText || ''}
                    onChange={(e) => handleChange('announcementText', e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </section>

                {/* Escrito de entrada */}
                <section className={cardClass}>
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                      <h2 className="text-lg font-bold mb-1">Escrito de entrada</h2>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        La editorial que abre la portada, debajo de la agenda. Se respetan los saltos
                        de línea y la sangría tal cual los pegues, así que puedes traer el texto
                        desde Word sin retocarlo.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(content.editorialActive)}
                      aria-label="Publicar el escrito de entrada"
                      onClick={() => handleChange('editorialActive', !content.editorialActive)}
                      className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${
                        content.editorialActive ? 'bg-brand-700' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        content.editorialActive ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div>
                        <label htmlFor="editorialKicker" className={labelClass}>Etiqueta</label>
                        <input
                          id="editorialKicker"
                          type="text"
                          maxLength={40}
                          placeholder="Escrito de entrada"
                          value={content.editorialKicker || ''}
                          onChange={(e) => handleChange('editorialKicker', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="editorialTitle" className={labelClass}>Título</label>
                        <input
                          id="editorialTitle"
                          type="text"
                          maxLength={160}
                          placeholder="La soledad pordiosera del escritor"
                          value={content.editorialTitle || ''}
                          onChange={(e) => handleChange('editorialTitle', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="editorialFont" className={labelClass}>Tipografía</label>
                      <select
                        id="editorialFont"
                        value={content.editorialFont || 'serif'}
                        onChange={(e) => handleChange('editorialFont', e.target.value)}
                        className={inputClass}
                      >
                        {EDITORIAL_FONTS.map((font) => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                      <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        La letra base del bloque. Cámbiala aquí y cambia todo el escrito de una vez.
                      </p>

                      <div className={`mt-4 rounded-lg border p-4 ${
                        isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Ajuste por sección
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                          {EDITORIAL_FONT_SECTIONS.map((section) => (
                            <div key={section.field}>
                              <label htmlFor={section.field} className={`block text-xs mb-1.5 ${
                                isDark ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {section.label}
                              </label>
                              <select
                                id={section.field}
                                value={content[section.field] || ''}
                                onChange={(e) => handleChange(section.field, e.target.value)}
                                className={`${inputClass} py-1.5 text-sm`}
                              >
                                <option value="">Igual que la general</option>
                                {EDITORIAL_FONTS.map((font) => (
                                  <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>

                        <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          Deja «Igual que la general» en lo que no quieras tocar. Una combinación que
                          funciona: Playfair en el título y serif clásica en el cuerpo, que es letra
                          de titular arriba y letra de leer abajo.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="editorialEpigraph" className={labelClass}>
                        Epígrafe <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>(opcional)</span>
                      </label>
                      <textarea
                        id="editorialEpigraph"
                        rows={3}
                        maxLength={400}
                        placeholder={'La cita que abre el texto\nY debajo, a quién pertenece'}
                        value={content.editorialEpigraph || ''}
                        onChange={(e) => handleChange('editorialEpigraph', e.target.value)}
                        className={`${inputClass} resize-y`}
                      />
                      <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Se pinta en cursiva, con un filete al lado. La atribución va en su propia línea.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="editorialBody" className={labelClass}>Cuerpo del escrito</label>
                      <textarea
                        id="editorialBody"
                        rows={18}
                        maxLength={MAX_EDITORIAL_BODY}
                        placeholder="Pega aquí el texto completo, con su sangría y sus versos."
                        value={content.editorialBody || ''}
                        onChange={(e) => handleChange('editorialBody', e.target.value)}
                        className={`${inputClass} resize-y leading-relaxed`}
                      />
                      <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {(content.editorialBody || '').length.toLocaleString('es-CO')} / {MAX_EDITORIAL_BODY.toLocaleString('es-CO')} caracteres.
                        Si el escrito es largo, en la portada se recorta con un botón de «Seguir leyendo».
                      </p>
                      <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong className="font-semibold">Para destacar dentro del texto:</strong>{' '}
                        rodea un fragmento con un asterisco a cada lado para que salga en{' '}
                        <em>cursiva</em>, y con dos para que salga en{' '}
                        <strong className="font-semibold">negrita</strong>. Un asterisco suelto se
                        queda tal cual, y las marcas no cruzan de una línea a otra.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="editorialAuthor" className={labelClass}>Firma</label>
                        <input
                          id="editorialAuthor"
                          type="text"
                          maxLength={120}
                          placeholder="Nombre de quien lo escribe"
                          value={content.editorialAuthor || ''}
                          onChange={(e) => handleChange('editorialAuthor', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="editorialAuthorRole" className={labelClass}>Cargo o descripción</label>
                        <input
                          id="editorialAuthorRole"
                          type="text"
                          maxLength={120}
                          placeholder="Docente y escritor"
                          value={content.editorialAuthorRole || ''}
                          onChange={(e) => handleChange('editorialAuthorRole', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Agenda de eventos */}
                <section className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
                    <h2 className="text-lg font-bold">Agenda de eventos</h2>
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {events.length}/{MAX_EVENTS}
                    </span>
                  </div>
                  <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Se muestran en la portada, encima del catálogo. Los eventos cuya fecha ya pasó
                    dejan de aparecer solos, sin que tengas que borrarlos.
                  </p>

                  {events.length === 0 ? (
                    <p className={`text-sm py-8 text-center rounded-lg border border-dashed ${
                      isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'
                    }`}>
                      Todavía no hay eventos anunciados.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {events.map((event, index) => (
                        <li
                          key={event.id}
                          className={`rounded-lg border p-4 ${
                            isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <span className={`text-xs font-bold tracking-wider uppercase ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              Evento {index + 1}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveEvent(index, -1)}
                                disabled={index === 0}
                                aria-label="Subir evento"
                                className={`px-2 py-1 rounded text-sm disabled:opacity-30 ${
                                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                                }`}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveEvent(index, 1)}
                                disabled={index === events.length - 1}
                                aria-label="Bajar evento"
                                className={`px-2 py-1 rounded text-sm disabled:opacity-30 ${
                                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                                }`}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEvent(event.id)}
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                  isDark ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                Quitar
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className={labelClass}>Nombre del evento</label>
                              <input
                                type="text"
                                maxLength={120}
                                placeholder="Ej.: Recital de poesía en la Biblioteca Departamental"
                                value={event.title}
                                onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
                                className={inputClass}
                              />
                            </div>

                            <div>
                              <label className={labelClass}>Enlace del evento</label>
                              <input
                                type="text"
                                placeholder="https://…"
                                value={event.link}
                                onChange={(e) => updateEvent(event.id, 'link', e.target.value)}
                                className={inputClass}
                              />
                              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                Dónde ocurre o dónde se inscribe: videollamada, formulario, publicación.
                                Debe empezar por «https://», o por «/» si es una página de este sitio.
                              </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <label className={labelClass}>Fecha y hora (opcional)</label>
                                <input
                                  type="datetime-local"
                                  value={event.date}
                                  onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                                  className={inputClass}
                                />
                              </div>

                              <div>
                                <label className={labelClass}>Lugar (opcional)</label>
                                <input
                                  type="text"
                                  maxLength={100}
                                  placeholder="Valledupar · Virtual"
                                  value={event.place}
                                  onChange={(e) => updateEvent(event.id, 'place', e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            {/* Un evento con fecha pasada se guarda igual, pero
                                la portada no lo muestra. Sin este aviso, la
                                única pista sería que "no se ve". */}
                            {isPastEvent(event) && (
                              <p className={`text-xs px-3 py-2 rounded-lg ${
                                isDark ? 'bg-amber-950/50 text-amber-300' : 'bg-amber-50 text-amber-800'
                              }`}>
                                Esta fecha ya pasó, así que el evento no aparecerá en la portada.
                                Cámbiala o deja el campo vacío si es una convocatoria sin fecha fija.
                              </p>
                            )}

                            <div>
                              <label className={labelClass}>Reseña breve (opcional)</label>
                              <textarea
                                rows={2}
                                maxLength={300}
                                placeholder="Una o dos frases sobre de qué se trata."
                                value={event.description}
                                onChange={(e) => updateEvent(event.id, 'description', e.target.value)}
                                className={`${inputClass} resize-none`}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {events.length < MAX_EVENTS && (
                    <button
                      type="button"
                      onClick={addEvent}
                      className={`mt-4 w-full py-2.5 rounded-lg border border-dashed text-sm font-semibold transition-colors ${
                        isDark
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      + Añadir evento
                    </button>
                  )}
                </section>

                {/* Invitaciones emergentes */}
                <section className={cardClass}>
                  <div className="flex items-start justify-between gap-6 mb-1">
                    <div>
                      <h2 className="text-lg font-bold mb-1">Invitaciones emergentes</h2>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Imágenes que aparecen en una ventana al entrar a la portada, una sola vez
                        por visita. Se cierran deslizando o tocando la ✕, y no vuelven a salir
                        hasta que la persona entre de nuevo al sitio en otra sesión.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(content.popupsActive)}
                      aria-label="Mostrar invitaciones emergentes"
                      onClick={() => handleChange('popupsActive', !content.popupsActive)}
                      className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${
                        content.popupsActive ? 'bg-brand-700' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        content.popupsActive ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <p className={`text-xs mb-6 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {popups.length}/{MAX_POPUPS} imágenes.
                  </p>

                  {popups.length === 0 ? (
                    <p className={`text-sm py-8 text-center rounded-lg border border-dashed ${
                      isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'
                    }`}>
                      Todavía no hay imágenes.
                    </p>
                  ) : (
                    <ul className="space-y-4 mb-4">
                      {popups.map((popup, index) => (
                        <li
                          key={popup.id}
                          className={`rounded-lg border p-4 ${
                            isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <span className={`text-xs font-bold tracking-wider uppercase ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              Imagen {index + 1}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => movePopup(index, -1)}
                                disabled={index === 0}
                                aria-label="Subir imagen en el orden"
                                className={`px-2 py-1 rounded text-sm disabled:opacity-30 ${
                                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                                }`}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => movePopup(index, 1)}
                                disabled={index === popups.length - 1}
                                aria-label="Bajar imagen en el orden"
                                className={`px-2 py-1 rounded text-sm disabled:opacity-30 ${
                                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                                }`}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removePopup(popup.id)}
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                  isDark ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                Quitar
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <img
                              src={popup.imageUrl}
                              alt=""
                              className="w-full sm:w-40 h-40 sm:h-28 object-cover rounded-lg shrink-0"
                            />

                            <div className="flex-1 min-w-0 space-y-3">
                              <div>
                                <label className={labelClass}>Enlace al tocar la imagen (opcional)</label>
                                <input
                                  type="text"
                                  placeholder="https://…"
                                  value={popup.link}
                                  onChange={(e) => updatePopup(popup.id, 'link', e.target.value)}
                                  className={inputClass}
                                />
                                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                  Debe empezar por «https://», o por «/» si es una página de este sitio.
                                  Déjalo vacío si la imagen es solo informativa.
                                </p>
                              </div>

                              <div>
                                <label className={labelClass}>Texto alternativo (opcional)</label>
                                <input
                                  type="text"
                                  maxLength={160}
                                  placeholder="Describe la imagen para lectores de pantalla"
                                  value={popup.alt}
                                  onChange={(e) => updatePopup(popup.id, 'alt', e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {popups.length < MAX_POPUPS && (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className={`px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                        isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}>
                        + Añadir imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePopupUpload}
                          className="hidden"
                        />
                      </label>

                      {popupUploadProgress !== null && (
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Subiendo… {popupUploadProgress}%
                        </span>
                      )}
                    </div>
                  )}
                </section>

                {/* Obras destacadas */}
                <section className={cardClass}>
                  <h2 className="text-lg font-bold mb-1">Obras destacadas</h2>
                  <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Hasta {MAX_FEATURED} obras aprobadas, en el orden en que aparecerán.
                    {' '}Seleccionadas: {featuredIds.length}/{MAX_FEATURED}.
                  </p>

                  {featuredWorks.length > 0 && (
                    <ol className="space-y-2 mb-6">
                      {featuredWorks.map((work, index) => (
                        <li
                          key={work.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                            isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}
                        >
                          <span className={`text-xs font-bold w-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-brand-700'}`}>
                            {index + 1}
                          </span>

                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold truncate">{work.title}</span>
                            <span className={`block text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {work.author}
                            </span>
                          </span>

                          <span className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => moveFeatured(index, -1)}
                              disabled={index === 0}
                              aria-label={`Subir ${work.title}`}
                              className={`w-7 h-7 rounded text-sm disabled:opacity-30 ${
                                isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                              }`}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveFeatured(index, 1)}
                              disabled={index === featuredWorks.length - 1}
                              aria-label={`Bajar ${work.title}`}
                              className={`w-7 h-7 rounded text-sm disabled:opacity-30 ${
                                isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                              }`}
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => toggleFeatured(work.id)}
                              aria-label={`Quitar ${work.title} de destacadas`}
                              className={`w-7 h-7 rounded text-sm ${
                                isDark ? 'text-rose-400 hover:bg-slate-700' : 'text-rose-600 hover:bg-slate-200'
                              }`}
                            >
                              ✕
                            </button>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}

                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar obra por título o autor…"
                    className={`${inputClass} mb-3`}
                  />

                  <div className={`max-h-72 overflow-y-auto rounded-lg border ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    {filteredWorks.length === 0 ? (
                      <p className={`px-4 py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No hay obras que coincidan.
                      </p>
                    ) : (
                      filteredWorks.map((work) => {
                        const selected = featuredIds.includes(work.id);

                        return (
                          <button
                            key={work.id}
                            onClick={() => toggleFeatured(work.id)}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b last:border-b-0 transition-colors ${
                              isDark
                                ? `border-slate-800 hover:bg-slate-800 ${selected ? 'bg-slate-800/60' : ''}`
                                : `border-slate-100 hover:bg-slate-50 ${selected ? 'bg-amber-50/60' : ''}`
                            }`}
                          >
                            <span
                              className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] text-white ${
                                selected
                                  ? 'bg-brand-700 border-brand-700'
                                  : isDark ? 'border-slate-600' : 'border-slate-300'
                              }`}
                              aria-hidden="true"
                            >
                              {selected && '✓'}
                            </span>

                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium truncate">{work.title}</span>
                              <span className={`block text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {work.author} · {work.genre}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

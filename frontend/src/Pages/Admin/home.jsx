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

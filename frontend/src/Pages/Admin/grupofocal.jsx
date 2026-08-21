import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Eye,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FocusGroupAttendeesModal from '../../components/FocusGroupAttendeesModal';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import {
  FOCUS_GROUP_TYPES,
  createFocusGroupSession,
  deleteFocusGroupSession,
  getFocusGroupSessions,
  updateFocusGroupSession,
} from '../../services/api';
import { FOCUS_GROUP_NAME, SESSION_KINDS } from '../../config/focusGroup';
import { isoToLocalInput, localInputToIso } from '../../utils/datetime';

const EMPTY_FORM = {
  type: FOCUS_GROUP_TYPES.SYNC,
  title: '',
  description: '',
  scheduledAt: '',
  duration: 90,
  meetingUrl: '',
  allowComments: true,
  isPublished: true,
};

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminGrupoFocal() {
  const { isDark } = useContext(ThemeContext);
  const { confirm, notify } = useDialog();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [attendeesSession, setAttendeesSession] = useState(null);

  const isSync = form.type === FOCUS_GROUP_TYPES.SYNC;

  const stats = useMemo(() => {
    const published = sessions.filter((item) => item.isPublished !== false);

    return {
      meetings: published.filter((item) => item.type === FOCUS_GROUP_TYPES.SYNC).length,
      topics: published.filter((item) => item.type === FOCUS_GROUP_TYPES.ASYNC).length,
      comments: sessions.reduce((sum, item) => sum + (item.commentsCount || 0), 0),
      attendees: sessions.reduce((sum, item) => sum + (item.attendeesCount || 0), 0),
    };
  }, [sessions]);

  const loadSessions = async () => {
    try {
      const response = await getFocusGroupSessions({ includeDrafts: true });
      setSessions(response.sessions || []);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    getFocusGroupSessions({ includeDrafts: true })
      .then((response) => {
        if (active) setSessions(response.sessions || []);
      })
      .catch((error) => {
        if (active) notify.error(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // `notify` es estable (viene memorizado del contexto); la carga es de montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = (type) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type });
    setIsFormOpen(true);
  };

  const openEdit = (session) => {
    setEditingId(session.id);
    setForm({
      type: session.type,
      title: session.title || '',
      description: session.description || '',
      scheduledAt: isoToLocalInput(session.scheduledAt),
      duration: session.duration || 90,
      meetingUrl: session.meetingUrl || '',
      allowComments: session.allowComments !== false,
      isPublished: session.isPublished !== false,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      notify.error('El tema y la descripción son obligatorios.');
      return;
    }

    if (isSync && (!form.scheduledAt || !form.meetingUrl.trim())) {
      notify.error('Una cátedra necesita fecha, hora y enlace.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      isPublished: form.isPublished,
    };

    if (isSync) {
      payload.scheduledAt = localInputToIso(form.scheduledAt);
      payload.duration = Number(form.duration) || 90;
      payload.meetingUrl = form.meetingUrl.trim();
      payload.allowComments = form.allowComments;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateFocusGroupSession(editingId, payload);
        notify.success('Encuentro actualizado correctamente.');
      } else {
        // El tipo solo viaja al crear: el backend no admite cambiarlo después.
        await createFocusGroupSession({ ...payload, type: form.type });
        notify.success('Encuentro creado correctamente.');
      }

      closeForm();
      await loadSessions();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (session) => {
    const confirmed = await confirm({
      title: 'Eliminar encuentro',
      message: 'Se borrará el encuentro y toda su conversación. No se puede deshacer.',
      detail: session.title,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteFocusGroupSession(session.id);
      notify.success('Encuentro eliminado correctamente.');
      await loadSessions();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const inputClasses = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-brand-700/20 focus:border-brand-700'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 tracking-wider uppercase ${
    isDark ? 'text-gray-300' : 'text-brand-700'
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
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-brand-700'}`}>
                  {FOCUS_GROUP_NAME}
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Programa cátedras con enlace de videollamada o abre tertulias para que la comunidad debata.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openCreate(FOCUS_GROUP_TYPES.SYNC)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
                >
                  <Video className="w-4 h-4" />
                  Nueva cátedra
                </button>
                <button
                  type="button"
                  onClick={() => openCreate(FOCUS_GROUP_TYPES.ASYNC)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                    isDark
                      ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                      : 'border-gray-300 text-brand-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Nueva tertulia
                </button>
              </div>
            </div>

            {!loading && sessions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatTile isDark={isDark} icon={Video} label="Cátedras publicadas" value={stats.meetings} />
                <StatTile isDark={isDark} icon={MessageSquare} label="Tertulias abiertas" value={stats.topics} />
                <StatTile isDark={isDark} icon={Users} label="Comentarios recibidos" value={stats.comments} />
                <StatTile isDark={isDark} icon={UserCheck} label="Confirmados a cátedras" value={stats.attendees} />
              </div>
            )}

            {isFormOpen && (
              <form
                onSubmit={handleSubmit}
                className={`mb-8 rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-brand-700'}`}>
                    {editingId
                      ? 'Editar encuentro'
                      : `Nuevo encuentro · ${SESSION_KINDS[form.type].name}`}
                  </h2>
                  <button
                    type="button"
                    onClick={closeForm}
                    className={isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {editingId && (
                  <p className={`mb-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    El tipo de encuentro no se puede cambiar. Para el otro modo, crea uno nuevo.
                  </p>
                )}

                <div className="mb-4">
                  <label className={labelClasses}>Tema del encuentro</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className={inputClasses}
                    placeholder="La palabra frente a la bala: memoria y conflicto"
                    maxLength={160}
                  />
                </div>

                <div className="mb-4">
                  <label className={labelClasses}>Descripción</label>
                  <textarea
                    rows={isSync ? 4 : 8}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className={inputClasses}
                    placeholder={
                      isSync
                        ? 'De qué se hablará en la cátedra y qué se espera de quien asista.'
                        : 'Plantea el tema con el detalle necesario para que la gente pueda debatirlo.'
                    }
                    maxLength={4000}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {form.description.length}/4000
                  </p>
                </div>

                {isSync && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className={labelClasses}>Fecha y hora</label>
                        <input
                          type="datetime-local"
                          value={form.scheduledAt}
                          onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Duración (min)</label>
                        <input
                          type="number"
                          min="15"
                          max="480"
                          value={form.duration}
                          onChange={(event) => setForm({ ...form, duration: event.target.value })}
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={labelClasses}>Enlace de la reunión</label>
                      <input
                        type="url"
                        value={form.meetingUrl}
                        onChange={(event) => setForm({ ...form, meetingUrl: event.target.value })}
                        className={inputClasses}
                        placeholder="https://meet.google.com/abc-defg-hij"
                      />
                      <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Google Meet, Zoom o Teams. Debe empezar por https://
                      </p>
                    </div>

                    <label className={`flex items-center gap-2 mb-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={form.allowComments}
                        onChange={(event) => setForm({ ...form, allowComments: event.target.checked })}
                        className="w-4 h-4 accent-amber-600"
                      />
                      Permitir comentarios antes y después de la reunión
                    </label>
                  </>
                )}

                <label className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                    className="w-4 h-4 accent-amber-600"
                  />
                  Publicar (visible en la página del grupo focal y avisa a la comunidad)
                </label>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? 'Guardar cambios' : 'Crear encuentro'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className={`flex items-center justify-center gap-3 py-20 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando encuentros…
              </div>
            ) : sessions.length === 0 ? (
              <p className={`text-sm py-16 text-center rounded-2xl border border-dashed ${
                isDark ? 'border-gray-800 text-gray-500' : 'border-gray-300 text-gray-500'
              }`}>
                Todavía no hay encuentros. Crea la primera cátedra o la primera tertulia.
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const sync = session.type === FOCUS_GROUP_TYPES.SYNC;

                  return (
                    <article
                      key={session.id}
                      className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${
                              sync
                                ? isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'
                                : isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700'
                            }`}>
                              {sync ? <Video className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                              {SESSION_KINDS[session.type]?.short || 'Encuentro'}
                            </span>

                            {session.isPublished === false && (
                              <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${
                                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                              }`}>
                                Borrador
                              </span>
                            )}
                          </div>

                          <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {session.title}
                          </h3>

                          <p className={`mt-1 text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {session.description}
                          </p>

                          <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {sync && session.scheduledAt && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {formatDate(session.scheduledAt)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {session.commentsCount || 0} comentarios
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              {session.views || 0} visitas
                            </span>
                            {sync && (
                              <button
                                type="button"
                                onClick={() => setAttendeesSession(session)}
                                className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
                                  isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:underline'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                {session.attendeesCount || 0} confirmados
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEdit(session)}
                            aria-label="Editar encuentro"
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(session)}
                            aria-label="Eliminar encuentro"
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'bg-rose-950/50 text-rose-300 hover:bg-rose-900/60' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {attendeesSession && (
              <FocusGroupAttendeesModal
                session={attendeesSession}
                isDark={isDark}
                onClose={() => setAttendeesSession(null)}
              />
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function StatTile({ isDark, icon: Icon, label, value }) {
  return (
    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-brand-700'}`} />
        <p className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </p>
      </div>
      <p className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

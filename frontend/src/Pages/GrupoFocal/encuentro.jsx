import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CalendarPlus, CheckCircle2, Clock, Loader2, MessageSquare, Users, Video } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FocusGroupComments from '../../components/FocusGroupComments';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { FOCUS_GROUP_TYPES, getFocusGroupSession, toggleFocusGroupAttendance } from '../../services/api';
import { FOCUS_GROUP_NAME, MEETING_STATE_LABELS, meetingState } from '../../config/focusGroup';
import { formatMeetingDate, stateBadgeClasses } from './helpers';
import { downloadSessionIcs } from '../../utils/calendar';

export default function GrupoFocalEncuentro() {
  const { id } = useParams();
  const { isDark } = useContext(ThemeContext);
  const { isAuthenticated } = useAuth();
  const { notify } = useDialog();

  const [session, setSession] = useState(null);
  const [comments, setComments] = useState([]);
  const [attending, setAttending] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // El estado no se reinicia al entrar: el efecto solo escribe desde las
  // respuestas de la petición, nunca de forma síncrona, que es lo que provoca
  // renders en cascada.
  useEffect(() => {
    let active = true;

    getFocusGroupSession(id)
      .then((response) => {
        if (!active) return;
        setSession(response.session);
        setComments(response.comments || []);
        setAttending(Boolean(response.attending));
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudo cargar el encuentro.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const isSync = session?.type === FOCUS_GROUP_TYPES.SYNC;
  const state = isSync ? meetingState(session) : 'abierto';

  const handleToggleAttendance = async () => {
    if (!isAuthenticated) {
      notify.error('Inicia sesión para confirmar tu asistencia.');
      return;
    }

    setRsvpLoading(true);
    try {
      const response = await toggleFocusGroupAttendance(session.id);
      setAttending(response.attending);
      setSession((previous) => ({
        ...previous,
        attendeesCount: Math.max(0, (previous.attendeesCount || 0) + (response.attending ? 1 : -1)),
      }));
      notify.success(response.message);
    } catch (err) {
      notify.error(err.message || 'No se pudo actualizar tu asistencia.');
    } finally {
      setRsvpLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-12">
        <Link
          to="/grupo-focal"
          className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors ${
            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:underline'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al {FOCUS_GROUP_NAME}
        </Link>

        {loading && (
          <div className={`flex items-center justify-center gap-3 py-24 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando encuentro…
          </div>
        )}

        {error && !loading && (
          <p className={`text-sm px-4 py-3 rounded-lg ${isDark ? 'bg-rose-950/50 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
            {error}
          </p>
        )}

        {session && !loading && (
          <>
            <header className="mb-8">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border ${stateBadgeClasses(state, isDark)}`}>
                {isSync ? <Video className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                {MEETING_STATE_LABELS[state]}
              </span>

              <h1 className={`mt-4 text-3xl sm:text-4xl font-serif font-bold leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {session.title}
              </h1>

              {isSync && (
                <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span className="first-letter:uppercase">{formatMeetingDate(session.scheduledAt)}</span>
                  </span>
                  {session.duration && (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      {session.duration} minutos
                    </span>
                  )}
                  {session.attendeesCount > 0 && (
                    <span className="inline-flex items-center gap-2">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      {session.attendeesCount} {session.attendeesCount === 1 ? 'confirmado' : 'confirmados'}
                    </span>
                  )}
                </div>
              )}
            </header>

            {/* Confirmar asistencia y agregar al calendario: solo tiene sentido
                para una cátedra que todavía no ha pasado. Después de terminada,
                el enlace de más abajo sigue disponible por si se reutiliza la
                sala, pero ya no hay nada que "confirmar". */}
            {isSync && state !== 'finalizado' && (
              <div className={`mb-8 rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
                isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-stone-200'
              }`}>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    {attending ? 'Vas a asistir' : '¿Vas a asistir?'}
                  </p>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                    {attending
                      ? 'Te avisaremos por correo un día antes.'
                      : 'Confirma para recibir un recordatorio por correo un día antes.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleAttendance}
                    disabled={rsvpLoading}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                      attending
                        ? isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'text-white hover:opacity-90'
                    }`}
                    style={attending ? undefined : { backgroundColor: 'var(--color-brand-700)' }}
                  >
                    {rsvpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {attending ? 'Asistencia confirmada' : 'Confirmar asistencia'}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadSessionIcs(session)}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
                      isDark
                        ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                        : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Añadir al calendario
                  </button>
                </div>
              </div>
            )}

            <div className={`rounded-2xl border p-6 sm:p-8 mb-8 ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-stone-200'}`}>
              <p className={`text-base leading-relaxed whitespace-pre-line ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                {session.description}
              </p>
            </div>

            {/* El enlace sigue visible después de la reunión: a veces se reutiliza
                la misma sala, y ocultarlo dejaría la ficha sin forma de volver. El
                estado de arriba ya avisa de que el encuentro terminó. */}
            {isSync && session.meetingUrl && (
              <div
                className={`rounded-2xl border p-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div>
                  <p className={`font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    {state === 'en_curso' ? 'La reunión está en curso' : 'Enlace de la reunión'}
                  </p>
                  <p className={`text-sm mt-1 break-all ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                    {session.meetingUrl}
                  </p>
                </div>
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-brand-700)' }}
                >
                  <Video className="w-4 h-4" />
                  Entrar a la reunión
                </a>
              </div>
            )}

            <FocusGroupComments
              sessionId={session.id}
              comments={comments}
              allowComments={session.allowComments !== false}
              onChange={setComments}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Loader2, MessageSquare, Video } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FocusGroupComments from '../../components/FocusGroupComments';
import { ThemeContext } from '../../context/ThemeContext';
import { FOCUS_GROUP_TYPES, getFocusGroupSession } from '../../services/api';
import { FOCUS_GROUP_NAME, MEETING_STATE_LABELS, meetingState } from '../../config/focusGroup';
import { formatMeetingDate, stateBadgeClasses } from './helpers';

export default function GrupoFocalEncuentro() {
  const { id } = useParams();
  const { isDark } = useContext(ThemeContext);

  const [session, setSession] = useState(null);
  const [comments, setComments] = useState([]);
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
                </div>
              )}
            </header>

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

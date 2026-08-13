import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, Radio, Users } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SessionCard from './SessionCard';
import { ThemeContext } from '../../context/ThemeContext';
import { FOCUS_GROUP_TYPES, getFocusGroupSessions } from '../../services/api';
import {
  ALFREDO_CORREA_BIO,
  FOCUS_GROUP_INTRO,
  FOCUS_GROUP_MOTTO,
  FOCUS_GROUP_NAME,
  FOUNDING_ESSAY,
  SESSION_KINDS,
  meetingState,
} from '../../config/focusGroup';
import focusGroupLogo from '../../assets/grupo-focal-alfredo-correa.jpeg';

/** Una de las dos modalidades del grupo: su cabecera y sus tarjetas. */
function SessionSection({ kind, icon: Icon, sessions, isDark, className = '' }) {
  return (
    <div className={className}>
      <header className="mb-8">
        <h2 className={`flex items-center gap-3 text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
          <Icon className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--color-brand-700)' }} />
          {kind.name}
        </h2>
        <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
          {kind.intro}
        </p>
      </header>

      {sessions.length === 0 ? (
        <p className={`text-sm py-10 text-center rounded-2xl border border-dashed ${
          isDark ? 'border-stone-800 text-stone-500' : 'border-stone-300 text-stone-500'
        }`}>
          {kind.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GrupoFocal() {
  const { isDark } = useContext(ThemeContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEssay, setShowEssay] = useState(false);

  useEffect(() => {
    let active = true;

    getFocusGroupSessions()
      .then((response) => {
        if (active) setSessions(response.sessions || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudieron cargar los encuentros.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Las reuniones se muestran de la más próxima a la más lejana (el listado del
  // servidor viene al revés, que es el orden natural de un archivo pero no el de
  // una agenda), y las que ya pasaron caen al final.
  const { meetings, topics } = useMemo(() => {
    const byUpcoming = (a, b) => {
      const aFinished = meetingState(a) === 'finalizado';
      const bFinished = meetingState(b) === 'finalizado';

      if (aFinished !== bFinished) return aFinished ? 1 : -1;

      // Lo que está por venir, de lo más próximo a lo más lejano; lo que ya
      // pasó, de lo más reciente hacia atrás.
      const comparison = (a.scheduledAt || '').localeCompare(b.scheduledAt || '');
      return aFinished ? -comparison : comparison;
    };

    return {
      meetings: sessions.filter((item) => item.type === FOCUS_GROUP_TYPES.SYNC).sort(byUpcoming),
      topics: sessions.filter((item) => item.type === FOCUS_GROUP_TYPES.ASYNC),
    };
  }, [sessions]);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
      <Navbar />

      <main className="flex-1">
        {/* ================= PORTADA ================= */}
        <section className={`px-4 sm:px-8 py-16 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <img
                src={focusGroupLogo}
                alt={FOCUS_GROUP_NAME}
                className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
              />
            </div>

            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
                <Users className="w-3 h-3" />
                Comunidad &amp; Debate
              </span>
              <h1 className={`text-4xl sm:text-5xl font-serif font-bold mb-4 leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {FOCUS_GROUP_NAME}
              </h1>
              <p className={`text-lg italic mb-6 ${isDark ? 'text-amber-400' : 'text-brand-700'}`}>
                «{FOCUS_GROUP_MOTTO}»
              </p>
              <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {FOCUS_GROUP_INTRO}
              </p>
            </div>
          </div>
        </section>

        {/* ================= ENCUENTROS ================= */}
        <section className="px-4 sm:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            {loading && (
              <div className={`flex items-center justify-center gap-3 py-24 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando encuentros…
              </div>
            )}

            {error && !loading && (
              <p className={`text-sm px-4 py-3 rounded-lg ${isDark ? 'bg-rose-950/50 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
                {error}
              </p>
            )}

            {!loading && !error && (
              <>
                <SessionSection
                  kind={SESSION_KINDS[FOCUS_GROUP_TYPES.SYNC]}
                  icon={Radio}
                  sessions={meetings}
                  isDark={isDark}
                  className="mb-16"
                />

                <SessionSection
                  kind={SESSION_KINDS[FOCUS_GROUP_TYPES.ASYNC]}
                  icon={MessageSquare}
                  sessions={topics}
                  isDark={isDark}
                />
              </>
            )}
          </div>
        </section>

        {/* ================= QUIÉN FUE ================= */}
        <section className={`px-4 sm:px-8 py-16 border-t ${isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-white border-stone-200'}`}>
          <div className="max-w-4xl mx-auto">
            <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
              Memoria
            </span>
            <h2 className={`text-3xl sm:text-4xl font-serif font-bold mb-8 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              ¿Quién fue Alfredo Correa De Andreís?
            </h2>

            <div className="space-y-5">
              {ALFREDO_CORREA_BIO.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <blockquote
              className={`mt-10 pl-6 border-l-4 text-2xl sm:text-3xl font-serif italic ${
                isDark ? 'border-amber-500/50 text-stone-100' : 'border-brand-700 text-stone-900'
              }`}
            >
              «¡Ey, loco, no dispares!»
            </blockquote>

            {/* El ensayo completo va plegado: es largo, y quien llega buscando la
                agenda de encuentros no debería tener que recorrerlo entero. */}
            <div className={`mt-12 pt-8 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
              <h3 className={`text-2xl font-serif font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {FOUNDING_ESSAY.title}
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {FOUNDING_ESSAY.author} · {FOUNDING_ESSAY.role}
              </p>

              <button
                type="button"
                onClick={() => setShowEssay((previous) => !previous)}
                aria-expanded={showEssay}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 hover:gap-3 transition-all"
              >
                {showEssay ? 'Ocultar el texto' : 'Leer el texto completo'} <span className="text-lg">→</span>
              </button>

              {showEssay && (
                <div className="mt-8 space-y-5">
                  {FOUNDING_ESSAY.paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className={`text-base leading-relaxed text-justify ${isDark ? 'text-stone-300' : 'text-stone-700'}`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

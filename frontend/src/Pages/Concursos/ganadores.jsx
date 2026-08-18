import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Loader2, Medal, Trophy } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getContestWinners } from '../../services/api';

// Oro, plata y bronce ya no pintan: el podio se ordena con los tres colores de
// la paleta, de más vivo a más apagado, para que el puesto se lea en la
// intensidad y no en un color cálido suelto fuera del conjunto.
const PODIUM = {
  1: { label: 'Primer lugar', light: 'bg-amber-50 text-amber-800 border-amber-300', dark: 'bg-amber-950/50 text-amber-300 border-amber-700' },
  2: { label: 'Segundo lugar', light: 'bg-brand-50 text-brand-800 border-brand-200', dark: 'bg-brand-950/50 text-brand-300 border-brand-700' },
  3: { label: 'Tercer lugar', light: 'bg-stone-100 text-stone-700 border-stone-300', dark: 'bg-stone-800 text-stone-300 border-stone-600' },
};

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function excerpt(text, length = 160) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

export default function Ganadores() {
  const { isDark } = useContext(ThemeContext);
  const [editions, setEditions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getContestWinners()
      .then((response) => {
        if (active) setEditions(response.editions || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudieron cargar los ganadores.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selected) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selected]);

  if (selected) {
    const podium = PODIUM[selected.position] || PODIUM[3];

    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
        <Navbar />

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-12">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors ${
              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:underline'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a los ganadores
          </button>

          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-5 ${
            isDark ? podium.dark : podium.light
          }`}>
            <Medal className="w-3.5 h-3.5" />
            {podium.label}
          </span>

          {selected.imageUrl && (
            <img
              src={selected.imageUrl}
              alt={`Ilustración de ${selected.title}`}
              className="w-full aspect-[16/9] object-cover rounded-2xl mb-8"
            />
          )}

          <h1 className={`text-3xl sm:text-4xl font-serif font-bold mb-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            {selected.title}
          </h1>

          <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-10 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            <span className="font-semibold">{selected.authorName}</span>
            <span aria-hidden="true">·</span>
            <span>{selected.editionName}</span>
            {selected.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(selected.publishedAt)}
                </span>
              </>
            )}
          </p>

          <div className={`whitespace-pre-wrap text-base sm:text-lg leading-relaxed font-serif ${
            isDark ? 'text-stone-300' : 'text-stone-800'
          }`}>
            {selected.content}
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12">
        <Link
          to="/concursos"
          className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors ${
            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:underline'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Todos los concursos
        </Link>

        <header className="mb-12">
          <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
            Palmarés
          </span>
          <h1 className={`text-4xl sm:text-5xl font-serif font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Ganadores de ediciones anteriores
          </h1>
          <p className={`max-w-2xl text-base sm:text-lg leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            El podio de cada edición cerrada, según la calificación del jurado. Las mejores
            historias quedan publicadas aquí para leerlas completas.
          </p>
        </header>

        {loading && (
          <div className={`flex items-center justify-center gap-3 py-24 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando ganadores…
          </div>
        )}

        {!loading && error && (
          <div className={`rounded-2xl border px-6 py-5 text-sm ${
            isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {error}
          </div>
        )}

        {!loading && !error && editions.length === 0 && (
          <div className={`rounded-2xl border border-dashed px-6 py-20 text-center ${
            isDark ? 'border-stone-800 text-stone-400' : 'border-stone-300 text-stone-600'
          }`}>
            <Trophy className="w-10 h-10 mx-auto mb-4 opacity-40" />
            <p className="text-sm max-w-md mx-auto">
              Todavía no hay ediciones cerradas. Cuando termine un concurso, su podio
              aparecerá aquí con los cuentos mejor calificados por el jurado.
            </p>
          </div>
        )}

        {!loading && !error && editions.length > 0 && (
          <div className="space-y-14">
            {editions.map((edition) => (
              <section key={edition.id || `${edition.contestId}__${edition.edition}`}>
                <header className={`flex flex-wrap items-baseline gap-3 mb-6 pb-3 border-b ${
                  isDark ? 'border-stone-800' : 'border-stone-200'
                }`}>
                  <h2 className={`font-serif text-2xl font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    {edition.name}
                  </h2>
                  {edition.edition && (
                    <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                      {`Edición ${edition.edition}`}
                    </span>
                  )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {edition.winners.map((winner) => {
                    const podium = PODIUM[winner.position] || PODIUM[3];

                    return (
                      <button
                        key={winner.id}
                        type="button"
                        onClick={() => setSelected({
                          ...winner,
                          editionName: edition.edition ? `${edition.name} ${edition.edition}` : edition.name,
                        })}
                        className={`group text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/10 ${
                          isDark
                            ? 'bg-stone-900 border-stone-800 hover:border-amber-500/40'
                            : 'bg-white border-stone-200 hover:border-amber-600/40'
                        }`}
                      >
                        <div className={`relative aspect-[16/10] overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                          {winner.imageUrl ? (
                            <img
                              src={winner.imageUrl}
                              alt={`Ilustración de ${winner.title}`}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className={`w-10 h-10 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
                            </div>
                          )}

                          <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
                            isDark ? podium.dark : podium.light
                          }`}>
                            <Medal className="w-3 h-3" />
                            {podium.label}
                          </span>
                        </div>

                        <div className="p-5">
                          <h3 className={`font-serif font-bold text-lg leading-snug line-clamp-2 mb-2 ${
                            isDark ? 'text-stone-100' : 'text-stone-900'
                          }`}>
                            {winner.title}
                          </h3>

                          <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-amber-400' : 'text-brand-700'}`}>
                            {winner.authorName}
                          </p>

                          <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                            {excerpt(winner.content)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

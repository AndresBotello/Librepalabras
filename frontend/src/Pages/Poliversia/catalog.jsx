import React, { useContext, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import MagazineViewer from '../../components/MagazineViewer';
import { ThemeContext } from '../../context/ThemeContext';
import { getPoliversiaEdition, getPoliversiaEditions, formatBytes } from '../../services/api';

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
}

export default function PoliversiaCatalog() {
  const { isDark } = useContext(ThemeContext);
  const [editions, setEditions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getPoliversiaEditions()
      .then((response) => {
        if (active) setEditions(response.editions || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudieron cargar las ediciones.');
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

  /**
   * Abrir una edición cuenta como una lectura: el backend suma la visita al
   * responder este GET. El registro va por detrás porque es estadística, no
   * contenido: si la petición falla, el lector igual ve la revista.
   */
  const openEdition = (edition) => {
    setSelected(edition);
    getPoliversiaEdition(edition.id).catch(() => {});
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12">
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`inline-flex items-center gap-2 text-sm font-semibold mb-6 transition-colors ${
                isDark ? 'text-amber-400 hover:text-amber-300' : 'text-[#5D4037] hover:underline'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al catálogo
            </button>

            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3 border border-amber-500/20">
                Edición N.º {selected.edition}
              </span>
              <h1 className={`text-3xl sm:text-4xl font-serif font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {selected.title}
              </h1>
              <p className={`mt-2 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {formatDate(selected.publishedAt)}
                {selected.pdfSize ? ` · ${formatBytes(selected.pdfSize)}` : ''}
              </p>
              {selected.description && (
                <p className={`mt-4 max-w-3xl leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  {selected.description}
                </p>
              )}
            </div>

            <MagazineViewer
              key={selected.id}
              url={selected.pdfUrl}
              isDark={isDark}
              title={selected.title}
            />
          </>
        ) : (
          <>
            <header className="mb-12">
              <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
                Publicación Periódica
              </span>
              <h1 className={`text-4xl sm:text-5xl font-serif font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Revista Poleversia
              </h1>
              <p className={`max-w-2xl text-base sm:text-lg leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Un diálogo multidisciplinario entre la literatura, las artes plásticas y el
                pensamiento crítico territorial. Elige una edición para leerla completa aquí mismo.
              </p>
            </header>

            {loading && (
              <div className={`flex items-center justify-center gap-3 py-24 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando ediciones…
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
                <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-40" />
                <p className="text-sm">Todavía no hay ediciones publicadas.</p>
              </div>
            )}

            {!loading && !error && editions.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {editions.map((edition) => (
                  <button
                    key={edition.id}
                    type="button"
                    onClick={() => openEdition(edition)}
                    className={`group text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/10 ${
                      isDark
                        ? 'bg-stone-900 border-stone-800 hover:border-amber-500/40'
                        : 'bg-white border-stone-200 hover:border-amber-600/40'
                    }`}
                  >
                    <div className={`relative aspect-[3/4] overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                      {edition.coverUrl ? (
                        <img
                          src={edition.coverUrl}
                          alt={`Portada de la edición ${edition.edition}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className={`w-10 h-10 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
                        </div>
                      )}

                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-stone-950/70 text-amber-300 backdrop-blur-sm">
                        N.º {edition.edition}
                      </span>
                    </div>

                    <div className="p-4">
                      <h2 className={`font-serif font-bold leading-snug line-clamp-2 mb-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                        {edition.title}
                      </h2>
                      <p className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(edition.publishedAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

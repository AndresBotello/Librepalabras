import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import OpinionColumnComments from './OpinionColumnComments';
import { addSectionWorkComment, deleteSectionWorkComment, getSectionWorkComments } from '../services/api';
import ReadingToolbar from './ReadingToolbar';
import FeaturedAuthors from './FeaturedAuthors';
import { readingContentStyle, useReadingPreferences } from '../context/ReadingPreferencesContext';

/**
 * Vista de lectura de una obra de sección: la misma hoja de la biblioteca
 * (encabezado centrado, sinopsis, cuerpo con letra capitular y barra de
 * lectura) con los autores a la derecha. El texto llega ya saneado del
 * servidor, por eso se pinta como HTML.
 */
export default function SectionWorkArticle({ section, work, kind, loading, error, isDark, onBack }) {
  const { fontScale, highContrast, dyslexiaFont } = useReadingPreferences();

  const isDrawing = kind?.imageRequired;

  // El mismo hilo de comentarios de las columnas, apuntando a las rutas de la
  // sección. Memoizado para que no se reinicie en cada render.
  const commentsApi = useMemo(() => ({
    list: (id, options) => getSectionWorkComments(section.value, id, options),
    add: (id, payload) => addSectionWorkComment(section.value, id, payload),
    remove: (id, commentId) => deleteSectionWorkComment(section.value, id, commentId),
  }), [section.value]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-sm font-serif transition-colors px-3 py-1.5 rounded-md ${
            isDark
              ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver a {section.label}</span>
        </button>
      </div>

      <ReadingToolbar isDark={isDark} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-9 min-w-0">
          {loading && (
            <p className={`py-20 text-center font-serif animate-pulse ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
              Abriendo…
            </p>
          )}

          {!loading && error && (
            <p className="py-20 text-center font-serif text-rose-500">{error}</p>
          )}

          {!loading && !error && work && (
            <article className={`rounded-xl shadow-xl border overflow-hidden transition-all duration-300 ${
              isDark
                ? 'bg-gray-950 border-slate-800 text-slate-200 shadow-black/50'
                : 'bg-gray-50 border-stone-200/80 text-stone-900 shadow-stone-900/5'
            }`}>
              <header className="px-5 sm:px-16 pt-10 sm:pt-16 pb-8 text-center border-b border-stone-200/50 dark:border-slate-800/80">
                <span className={`inline-block text-xs uppercase tracking-widest font-sans font-semibold mb-3 px-3 py-1 rounded-full ${
                  isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100/60 text-amber-900'
                }`}>
                  {kind?.emoji} {kind?.label || section.label}
                </span>

                <h1 className={`text-3xl sm:text-5xl font-serif font-bold leading-tight mb-4 break-words ${
                  isDark ? 'text-amber-50' : 'text-stone-900'
                }`}>
                  {work.title}
                </h1>

                <div className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-serif text-sm italic ${
                  isDark ? 'text-slate-400' : 'text-stone-600'
                }`}>
                  <span>Por</span>
                  <span className={`font-semibold not-italic ${isDark ? 'text-slate-200' : 'text-stone-900'}`}>
                    {work.author || 'Anónimo'}
                  </span>
                  {work.childAge && <span>· {work.childAge} años</span>}
                  {work.municipality && <span>· {work.municipality}</span>}
                  {work.createdAt && (
                    <>
                      <span>•</span>
                      <span>{new Date(work.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}</span>
                    </>
                  )}
                </div>
              </header>

              {work.cover && (
                <div className="px-4 sm:px-16 pt-8 flex justify-center">
                  {/* El dibujo es la obra: se muestra entero y a buen tamaño.
                      En un texto, la imagen es solo una ilustración. */}
                  <img
                    src={work.cover}
                    alt={isDrawing ? `Dibujo: ${work.title}` : ''}
                    className={`rounded-lg shadow-lg border border-stone-200/30 dark:border-slate-800 object-contain ${
                      isDrawing ? 'w-full max-h-[70vh]' : 'w-full max-w-md max-h-96'
                    }`}
                  />
                </div>
              )}

              {work.description && (
                <div className="px-5 sm:px-16 pt-8 pb-4">
                  <div className={`p-5 sm:p-6 rounded-lg text-sm sm:text-base font-serif italic leading-relaxed border-l-2 ${
                    isDark
                      ? 'bg-slate-900/50 border-amber-500/40 text-slate-300'
                      : 'bg-amber-50/40 border-amber-600/40 text-stone-700'
                  }`}>
                    <p className="font-sans text-xs font-bold uppercase tracking-wider not-italic mb-2 opacity-60">
                      Sobre este aporte
                    </p>
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: work.description }}
                    />
                  </div>
                </div>
              )}

              {work.content && (
                <section className="px-5 sm:px-20 py-10">
                  <div
                    className={`prose dark:prose-invert max-w-none font-serif text-base sm:text-lg leading-relaxed text-justify space-y-6 rounded-lg transition-colors [&>*:first-child]:first-letter:float-left [&>*:first-child]:first-letter:text-5xl [&>*:first-child]:first-letter:font-serif [&>*:first-child]:first-letter:font-bold [&>*:first-child]:first-letter:mr-3 [&>*:first-child]:first-letter:leading-none [&>*:first-child]:first-letter:text-amber-600 dark:[&>*:first-child]:first-letter:text-amber-400 ${
                      highContrast
                        ? isDark
                          ? 'bg-black text-white p-6 -mx-6'
                          : 'bg-white text-black p-6 -mx-6 border border-stone-900/10'
                        : isDark ? 'text-slate-300' : 'text-stone-800'
                    }`}
                    style={readingContentStyle({ fontScale, dyslexiaFont })}
                    dangerouslySetInnerHTML={{ __html: work.content }}
                  />
                </section>
              )}

              <div className="px-5 sm:px-16 pb-10">
                <OpinionColumnComments columnId={work.id} isDark={isDark} api={commentsApi} subject="obra" />
              </div>
            </article>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <FeaturedAuthors
              isDark={isDark}
              title={section.authors.title}
              noteTitle={section.authors.noteTitle}
              note={section.authors.note}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

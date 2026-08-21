import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeaturedAuthors from '../../components/FeaturedAuthors';
import ReadingToolbar from '../../components/ReadingToolbar';
import { ThemeContext } from '../../context/ThemeContext';
import { readingContentStyle, useReadingPreferences } from '../../context/ReadingPreferencesContext';
import { getOpinionColumnById } from '../../services/api';

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OpinionColumnDetailPage() {
  const { slug } = useParams();
  const { isDark } = useContext(ThemeContext);
  const { fontScale, highContrast, dyslexiaFont } = useReadingPreferences();
  const [column, setColumn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadColumn() {
      try {
        const response = await getOpinionColumnById(slug);
        setColumn(response.column || null);
      } catch (error) {
        console.error('Error cargando la columna:', error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) loadColumn();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={`min-h-screen px-4 py-10 text-center ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-[#f3efe7] text-slate-600'}`}>
          Cargando columna...
        </main>
        <Footer />
      </>
    );
  }

  if (!column) {
    return (
      <>
        <Navbar />
        <main className={`min-h-screen px-4 py-10 ${isDark ? 'bg-slate-950' : 'bg-[#f3efe7]'}`}>
          <div className={`mx-auto max-w-3xl overflow-hidden rounded-[32px] border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-[#d9cbb1] bg-white'}`}>
            <div className={`border-b px-6 py-5 text-center sm:px-10 ${isDark ? 'border-slate-700' : 'border-[#e8dcc7]'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.38em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>Editorial</p>
            </div>

            <div className="px-6 py-10 text-center sm:px-10">
              <h1 className={`text-3xl font-black uppercase leading-tight tracking-[-0.05em] sm:text-5xl ${isDark ? 'text-slate-50' : 'text-slate-900'}`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Columna no encontrada
              </h1>
              <p className={`mx-auto mt-4 max-w-xl text-sm leading-7 sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                La columna que buscas no está disponible o ya no está publicada.
              </p>

              <Link
                to="/columnas"
                className="mt-8 inline-flex items-center rounded-full bg-brand-700 px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-800"
              >
                Volver a columnas
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
        {/* Lectura a la izquierda y autores de la casa a la derecha, fijos
            mientras se baja por la columna. Debajo de lg no cabe la barra, así
            que se reordena para que abra la página en vez de cerrarla. */}
        <div className="mx-auto grid max-w-[1200px] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="lg:sticky lg:top-6 lg:order-2">
            <FeaturedAuthors
              isDark={isDark}
              title="Nuestros columnistas"
              noteTitle="Las voces que sostienen esta sección"
              note="Autores de la región que firman aquí su análisis y su crítica sobre la actualidad, la cultura y la palabra escrita."
            />
          </div>

          <article className={`min-w-0 overflow-hidden rounded-[32px] border shadow-sm lg:order-1 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            {column.coverUrl && (
              <div className={`overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <img src={column.coverUrl} alt={column.title} className="h-72 w-full object-cover sm:h-96" />
              </div>
            )}

            <div className="space-y-8 p-6 sm:p-10 lg:p-12">
              <header className={`border-b pb-6 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.38em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>Columna de opinión</p>
                <h1 className={`mt-4 text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-5xl ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                  {column.title}
                </h1>
                {column.subtitle && <p className={`mt-4 text-lg italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{column.subtitle}</p>}
                <div className={`mt-6 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{column.author || 'Autor'}</span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                  <span>{formatDate(column.publishedAt)}</span>
                </div>
              </header>

              <ReadingToolbar isDark={isDark} />

              <div
                className={
                  highContrast
                    ? `max-w-none rounded-lg p-6 -mx-2 text-base leading-8 [&_p]:mb-5 [&_p]:leading-8 [&_strong]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-6 [&_img]:rounded-2xl [&_img]:shadow-md [&_a]:underline ${
                        isDark
                          ? 'bg-black text-white [&_strong]:text-white [&_blockquote]:border-slate-500 [&_a]:text-amber-300'
                          : 'bg-white text-black border border-slate-900/10 [&_strong]:text-black [&_blockquote]:border-slate-400 [&_a]:text-brand-700'
                      }`
                    : isDark
                      ? 'max-w-none text-base leading-8 text-slate-300 [&_p]:mb-5 [&_p]:leading-8 [&_strong]:font-bold [&_strong]:text-slate-100 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-6 [&_img]:rounded-2xl [&_img]:shadow-md [&_a]:text-amber-300 [&_a]:underline'
                      : 'max-w-none text-base leading-8 text-slate-700 [&_p]:mb-5 [&_p]:leading-8 [&_strong]:font-bold [&_strong]:text-slate-900 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-6 [&_img]:rounded-2xl [&_img]:shadow-md [&_a]:text-brand-700 [&_a]:underline'
                }
                style={readingContentStyle({ fontScale, dyslexiaFont })}
                dangerouslySetInnerHTML={{ __html: column.content }}
              />

              <div className={`flex items-center justify-between gap-4 border-t pt-6 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <Link to="/columnas" className={`inline-flex rounded-full border px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] transition ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                  Volver a columnas
                </Link>
              </div>
              </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}

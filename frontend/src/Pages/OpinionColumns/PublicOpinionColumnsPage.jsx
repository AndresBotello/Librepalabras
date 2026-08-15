import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getPublishedOpinionColumns } from '../../services/api';

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(value) {
  if (!value) return 'Reciente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Reciente';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PublicOpinionColumnsPage() {
  const { isDark } = useContext(ThemeContext);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadColumns() {
      try {
        const response = await getPublishedOpinionColumns();
        setColumns(response.columns || []);
      } catch (error) {
        console.error('Error cargando columnas públicas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadColumns();
  }, []);

  const [featuredColumn, ...restColumns] = columns;

  return (
    <>
      <Navbar />
      <main className={`min-h-screen px-3 py-4 sm:px-6 lg:px-8 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#dfe5e8] text-slate-800'}`}>
        <div className="mx-auto max-w-[1500px]">
          <header className={`mb-6 border-y px-3 pb-6 pt-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.28)] sm:mb-8 sm:px-5 lg:px-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-[#f4f5f4]'}`}>
            <div className={`flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
              <div className="space-y-2">
                <p className={`text-[0.68rem] font-bold uppercase tracking-[0.28em] sm:text-[0.8rem] sm:tracking-[0.38em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>LiberaPalabras</p>
                <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.28em] sm:text-[0.8rem] sm:tracking-[0.42em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Editorial</p>
              </div>
              <div className={`text-left text-[0.62rem] uppercase tracking-[0.22em] sm:text-right sm:text-[0.78rem] sm:tracking-[0.28em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-start gap-4 lg:mt-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div className="w-full max-w-[900px]">
                <h1
                  className={`select-none text-[clamp(2.7rem,13vw,6rem)] font-black uppercase leading-[0.82] tracking-[-0.08em] sm:text-[clamp(4rem,9vw,10rem)] lg:text-[clamp(5rem,9vw,17rem)] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  Columnas de
                  <span className="block">Opinión</span>
                </h1>
              </div>

              <p className={`max-w-[520px] text-base leading-[1.45] sm:text-[clamp(1.05rem,2vw,2rem)] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Análisis, crítica y mirada editorial para entender mejor la actualidad, la cultura y la palabra escrita.
              </p>
            </div>
          </header>

          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
              Cargando columnas...
            </div>
          ) : columns.length === 0 ? (
            <div className={`rounded-[28px] border-2 border-dashed p-8 text-center shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)] sm:p-12 ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-[#eef1f3] text-slate-700'}`}>
              <p className={`text-[clamp(1.25rem,2vw,2.3rem)] font-medium leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                Todavía no hay columnas publicadas.
              </p>
            </div>
          ) : (
            <>
              {featuredColumn && (
                <section className={`mb-6 overflow-hidden rounded-[22px] border shadow-sm sm:mb-8 sm:rounded-[30px] ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="relative min-h-[200px] bg-slate-200 sm:min-h-[260px]">
                      {featuredColumn.coverUrl ? (
                        <img src={featuredColumn.coverUrl} alt={featuredColumn.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-xl font-black uppercase tracking-[0.18em] text-white sm:min-h-[260px] sm:text-3xl sm:tracking-[0.25em]">
                          Editorial
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between p-4 sm:p-6 lg:p-10">
                      <div>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.28em] sm:text-[10px] sm:tracking-[0.32em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>Portada</p>
                        <div className={`mt-3 flex items-center justify-between gap-3 text-[9px] font-semibold uppercase tracking-[0.16em] sm:mt-4 sm:text-[11px] sm:tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span className="truncate">{featuredColumn.author || 'Autor'}</span>
                          <span>{formatDate(featuredColumn.publishedAt)}</span>
                        </div>
                        <h2 className={`mt-4 text-[1.8rem] font-black uppercase leading-[1.02] tracking-[-0.04em] sm:mt-5 sm:text-3xl sm:leading-tight lg:text-4xl ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                          {featuredColumn.title}
                        </h2>
                        {featuredColumn.subtitle && (
                          <p className={`mt-3 text-sm font-medium italic sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{featuredColumn.subtitle}</p>
                        )}
                        <p className={`mt-4 text-sm leading-6 sm:mt-5 sm:leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {stripHtml(featuredColumn.content).slice(0, 220)}{stripHtml(featuredColumn.content).length > 220 ? '…' : ''}
                        </p>
                      </div>

                      <div className="mt-5 sm:mt-6">
                        <Link
                          to={`/columnas/${featuredColumn.id}`}
                          className="inline-flex items-center rounded-full bg-brand-700 px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-brand-800 sm:px-5 sm:text-sm"
                        >
                          Leer columna
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {restColumns.map((column) => (
                  <article key={column.id} className={`group overflow-hidden rounded-[20px] border shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md sm:rounded-[26px] ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <div className="relative h-52 overflow-hidden bg-slate-200 sm:h-56">
                      {column.coverUrl ? (
                        <img src={column.coverUrl} alt={column.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-base font-black uppercase tracking-[0.2em] text-white sm:text-lg sm:tracking-[0.24em]">
                          Opinión
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-4 sm:p-5 sm:p-6">
                      <div className={`flex items-center justify-between gap-3 text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="truncate">{column.author || 'Autor'}</span>
                        <span>{formatDate(column.publishedAt)}</span>
                      </div>

                      <div>
                        <h3 className={`text-xl font-black uppercase leading-tight tracking-[-0.04em] sm:text-2xl ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                          {column.title}
                        </h3>
                        {column.subtitle && (
                          <p className={`mt-2 text-xs italic sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{column.subtitle}</p>
                        )}
                      </div>

                      <p className={`text-sm leading-6 sm:leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {stripHtml(column.content).slice(0, 150)}{stripHtml(column.content).length > 150 ? '…' : ''}
                      </p>

                      <Link
                        to={`/columnas/${column.id}`}
                        className={`inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] sm:text-sm ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-brand-700 hover:text-brand-800'}`}
                      >
                        Leer más
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

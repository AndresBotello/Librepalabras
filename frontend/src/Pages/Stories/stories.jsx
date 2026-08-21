import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  Heart, MessageCircle, Share2, Download, ChevronLeft, ChevronRight, BookOpen, Eye, ArrowLeft, Bookmark,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getApprovedWorks, toggleWorkLike, getWorkById } from '../../services/api';
import genresData from '../../config/genres.json';
import { GenreIcon } from '../../config/genreIcons';
import LiteraryComments from '../../components/LiteraryComments';
import FeaturedAuthors from '../../components/FeaturedAuthors';
import LiteraryRatings from '../../components/LiteraryRatings';
import ReadingToolbar from '../../components/ReadingToolbar';
import { readingContentStyle, useReadingPreferences } from '../../context/ReadingPreferencesContext';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const WORKS_PER_PAGE = 12;

export default function Stories() {
  const { isDark } = useContext(ThemeContext);
  const { fontScale, highContrast, dyslexiaFont } = useReadingPreferences();
  const [works, setWorks] = useState([]);
  const [loadedWork, setLoadedWork] = useState(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * La categoría vive en la URL (?genero=poesía) en vez de en el estado.
   *
   * Así el menú de la barra superior puede enlazar directamente a una
   * categoría, el enlace se puede compartir, y el botón "atrás" del navegador
   * deshace el filtro en lugar de sacarte de la página.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const genreParam = searchParams.get('genero');
  const selectedGenre = genresData.genres.some((g) => g.value === genreParam) ? genreParam : 'all';

  const setSelectedGenre = useCallback((value) => {
    setSearchParams(value && value !== 'all' ? { genero: value } : {}, { replace: true });
  }, [setSearchParams]);

  /**
   * La obra abierta también vive en la URL (?obra=id), por las mismas razones
   * que la categoría y por una más: así el buscador de la portada puede llevar
   * directamente a una obra, y no solo al listado.
   */
  const workParam = searchParams.get('obra');

  const openWork = useCallback((id) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('obra', id);
      return next;
    });
  }, [setSearchParams]);

  const closeWork = useCallback(() => {
    setCurrentPdfPage(1);
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('obra');
      return next;
    });
  }, [setSearchParams]);

  /**
   * La obra que se está leyendo es siempre la del parámetro, y solo cuando ya
   * se ha descargado. Derivarla en lugar de guardarla evita el estado que
   * contradice a la URL: al cerrar, o al usar el botón "atrás", no hay nada que
   * limpiar porque el parámetro ya no está.
   */
  const selectedWork = loadedWork?.id === workParam ? loadedWork : null;

  useEffect(() => {
    if (!workParam) return undefined;

    let cancelled = false;

    getWorkById(workParam)
      .then((response) => {
        // Si al volver ya no estamos mirando esa obra, la respuesta no sirve.
        if (!cancelled && response.ok) {
          setLoadedWork(response.work);
        }
      })
      .catch((err) => console.error('Error cargando obra:', err));

    return () => {
      cancelled = true;
    };
  }, [workParam]);

  useEffect(() => {
    loadWorks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre]);

  const loadWorks = async () => {
    try {
      setError('');
      const response = await getApprovedWorks();
      if (response.ok && response.works && response.works.length > 0) {
        // Ojo: aquí NO se cierra la obra abierta. Cargar el listado y abrir una
        // obra por su enlace ocurren a la vez, y ganaba el que terminara último.
        setWorks(response.works);
      } else {
        setError('No hay obras publicadas aún');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGenreInfo = useCallback((genre) => {
    return genresData.genres.find(g => g.value === genre);
  }, []);

  const filteredWorks = useMemo(() => {
    return selectedGenre === 'all' ? works : works.filter(w => w.genre === selectedGenre);
  }, [works, selectedGenre]);

  const paginatedWorks = useMemo(() => {
    const startIndex = (currentPage - 1) * WORKS_PER_PAGE;
    return filteredWorks.slice(startIndex, startIndex + WORKS_PER_PAGE);
  }, [filteredWorks, currentPage]);

  const totalPages_Gallery = useMemo(() => {
    return Math.ceil(filteredWorks.length / WORKS_PER_PAGE);
  }, [filteredWorks.length]);

  const handleToggleLike = async () => {
    if (!selectedWork) return;
    setLikeLoading(true);
    try {
      const response = await toggleWorkLike(selectedWork.id);
      if (response.ok) {
        setLoadedWork(prev => ({
          ...prev,
          likesCount: response.likesCount || 0,
        }));
      }
    } catch (err) {
      console.error('Error al dar like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentAdded = (comment, action, commentId) => {
    if (action === 'delete') {
      setLoadedWork(prev => ({
        ...prev,
        comments: (prev.comments || []).filter(c => c.id !== commentId),
        totalComments: (prev.totalComments || 0) - 1,
      }));
    } else if (action === 'like' && comment) {
      setLoadedWork(prev => ({
        ...prev,
        comments: (prev.comments || []).map(c => c.id === commentId ? comment : c),
      }));
    } else {
      setLoadedWork(prev => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
        totalComments: (prev.totalComments || 0) + 1,
      }));
    }
  };

  const handleRatingAdded = (newAverage) => {
    setLoadedWork(prev => ({
      ...prev,
      averageRating: newAverage,
    }));
  };

  const handleDownload = () => {
    if (selectedWork?.pdfUrl) {
      const link = document.createElement('a');
      link.href = selectedWork.pdfUrl;
      link.download = `${selectedWork.title}.pdf`;
      link.click();
    }
  };

  const goToPreviousPage = () => {
    setCurrentPdfPage(Math.max(1, currentPdfPage - 1));
  };

  const goToNextPage = () => {
    setCurrentPdfPage(Math.min(totalPages, currentPdfPage + 1));
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
  };


  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-stone-50 text-stone-600'}`}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="animate-pulse font-serif text-lg">Preparando la biblioteca...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950' : 'bg-stone-50'}`}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className={`p-8 rounded-2xl text-center max-w-md shadow-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
            <p className={`text-lg font-serif font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              {error}
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
              Publica una obra para que aparezca aquí
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const story = selectedWork;
  const genreInfo = getGenreInfo(story?.genre);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-stone-900'
    }`}>
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 py-8 sm:py-12">
        {!selectedWork ? (
          /* =================================================================== */
          /* GALERÍA LITERARIA (VISTA MOSAICO)                                  */
          /* =================================================================== */
          <div className="max-w-7xl mx-auto">
            {/* Encabezado Principal */}
            <header className="mb-10 text-center sm:text-left">
              <h1 className={`text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-3 ${isDark ? 'text-amber-100' : 'text-stone-900'}`}>
                Biblioteca de Literatura
              </h1>
              <p className={`text-base sm:text-lg max-w-2xl font-serif italic ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                Explora manuscritos, relatos y creaciones literarias de autores independientes.
              </p>
            </header>

            {/* Las categorías se eligen desde el menú de la barra superior. Aquí
                solo queda la marca de cuál se está viendo: sin ella, llegar
                filtrado se vería igual que ver el catálogo completo, y no
                habría forma de quitar el filtro. */}
            <div className={`mb-12 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
              {selectedGenre !== 'all' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-serif ${
                    isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-stone-900 text-stone-50'
                  }`}>
                    <GenreIcon genre={selectedGenre} />
                    {getGenreInfo(selectedGenre)?.label || selectedGenre}
                    <span className="text-[11px] font-sans tabular-nums opacity-70">
                      {filteredWorks.length}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedGenre('all')}
                    className={`text-sm font-semibold transition-colors ${
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Quitar filtro
                  </button>
                </div>
              )}
            </div>

            {/* Dos columnas: las obras a la izquierda y los autores a la
                derecha. En móvil no hay "al lado", así que la barra baja
                debajo del listado. */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <div className="lg:col-span-9">
            {/* Categoría sin obras: al menú de categorías de la barra superior
                se puede llegar a una vacía, y sin esto la página se quedaba en
                blanco como si estuviera rota. */}
            {filteredWorks.length === 0 && (
              <div className={`py-20 text-center ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                <p className="font-serif text-xl mb-2">
                  Todavía no hay obras en {getGenreInfo(selectedGenre)?.label || 'esta categoría'}.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedGenre('all')}
                  className={`text-sm font-semibold underline transition-colors ${
                    isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:text-brand-800'
                  }`}
                >
                  Ver toda la biblioteca
                </button>
              </div>
            )}

            {/* Grid de Libros / Portadas.
                Las columnas suben con el ancho para que la portada se quede
                siempre en torno a 170px: a tres columnas fijas, en escritorio
                cada una crecía por encima de los 280px y la tapa dejaba de
                leerse como la de un libro para parecer una foto de portada. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
              {paginatedWorks.map((work) => {
                const genre = getGenreInfo(work.genre);
                return (
                  <div
                    key={work.id}
                    onClick={() => {
                      openWork(work.id);
                      setCurrentPdfPage(1);
                    }}
                    className="group cursor-pointer flex flex-col transition-transform duration-300 hover:-translate-y-1.5"
                  >
                    {/* Estructura de Portada estilo Libro Impreso: 2:3, la
                        proporción de un libro de bolsillo. El lomo queda a la
                        izquierda, con la esquina casi recta, y el canto de las
                        hojas a la derecha, más redondeado: así es como se ve un
                        libro cerrado de frente. */}
                    <div className={`relative aspect-[2/3] rounded-l-xs rounded-r-lg overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 border ${
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-stone-100'
                    }`}>

                      {/* Lomo: la sombra pegada al canto izquierdo y, justo al
                          lado, una línea clara. Es esa línea la que da la
                          sensación de pliegue de la tapa. */}
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 to-transparent z-10 pointer-events-none" />
                      <div className="absolute inset-y-0 left-2.5 w-px bg-white/15 z-10 pointer-events-none" />

                      {work.cover ? (
                        <img
                          src={work.cover}
                          alt={work.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        /* Portada tipográfica para las obras sin imagen. El
                           texto va más contenido que antes porque la tapa ahora
                           mide bastante menos. */
                        <div className={`w-full h-full p-4 pl-5 flex flex-col justify-between ${
                          isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-amber-100/50 to-stone-200'
                        }`}>
                          <BookOpen className={`w-6 h-6 ${isDark ? 'text-amber-400/60' : 'text-stone-700/60'}`} />
                          <h3 className={`font-serif text-sm font-bold line-clamp-4 leading-snug ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                            {work.title}
                          </h3>
                        </div>
                      )}

                      {/* Info emergente suave al pasar el mouse */}
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 pl-4 flex flex-col justify-end text-white z-20">
                        <span className="text-[10px] uppercase tracking-wider text-amber-300 font-sans mb-1">{genre?.label}</span>
                        <h4 className="font-serif font-bold text-xs line-clamp-3">{work.title}</h4>
                        <p className="text-[11px] text-slate-300 mt-1">{work.author || 'Anónimo'}</p>
                      </div>
                    </div>

                    {/* Metadatos inferiores */}
                    <div className="mt-3 flex flex-col gap-1">
                      <h3 className={`font-serif font-semibold text-sm line-clamp-1 group-hover:text-amber-600 transition-colors ${
                        isDark ? 'text-slate-200' : 'text-stone-900'
                      }`}>
                        {work.title}
                      </h3>
                      <p className={`text-xs font-serif italic ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {work.author || 'Anónimo'}
                      </p>

                      {/* Contadores en una sola línea: con la tapa más estrecha,
                          a tamaño `xs` los tres se partían en dos renglones. */}
                      <div className={`flex items-center gap-2.5 text-[11px] tabular-nums mt-1 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{work.views || 0}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{work.totalRatings || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{work.totalComments || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages_Gallery > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm font-serif transition-all ${
                    currentPage === 1
                      ? isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  Anterior
                </button>
                <span className={`px-4 py-2 text-sm font-serif ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                  Página {currentPage} de {totalPages_Gallery}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages_Gallery, currentPage + 1))}
                  disabled={currentPage === totalPages_Gallery}
                  className={`px-4 py-2 rounded-md text-sm font-serif transition-all ${
                    currentPage === totalPages_Gallery
                      ? isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  Siguiente
                </button>
              </nav>
            )}
              </div>

              {/* Columna derecha. `sticky` la mantiene a la vista mientras se
                  recorre el listado, y solo desde `lg`, que es cuando existe
                  la segunda columna. */}
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-24">
                  <FeaturedAuthors isDark={isDark} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================== */
          /* VISTA DE LECTURA (EXPERIENCIA EDITORIAL ENFOCADA)                  */
          /* =================================================================== */
          <div className="max-w-7xl mx-auto">
            {/* Barra de navegación superior */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={closeWork}
                className={`inline-flex items-center gap-2 text-sm font-serif transition-colors px-3 py-1.5 rounded-md ${
                  isDark
                    ? 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a la biblioteca</span>
              </button>
            </div>

            <ReadingToolbar isDark={isDark} />

            {/* CONTENEDOR TIPO HOJA DE LIBRO (CANVAS DE LECTURA) */}

            {/* Dos columnas también aquí: la lectura conserva su ancho (9 de 12
                sobre un contenedor más ancho da prácticamente los mismos ~900px
                de antes) y los autores acompañan a la derecha. */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <div className="lg:col-span-9 min-w-0">
            <article className={`rounded-xl shadow-xl border transition-all duration-300 overflow-hidden ${
              isDark
                ? 'bg-gray-950 border-slate-800 text-slate-200 shadow-black/50'
                : 'bg-gray-50 border-stone-200/80 text-stone-900 shadow-stone-900/5'
            }`}>
              
              {/* Encabezado del Manuscrito */}
              <header className="px-6 sm:px-16 pt-12 sm:pt-16 pb-8 text-center border-b border-stone-200/50 dark:border-slate-800/80">
                <span className={`inline-block text-xs uppercase tracking-widest font-sans font-semibold mb-3 px-3 py-1 rounded-full ${
                  isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100/60 text-amber-900'
                }`}>
                  {genreInfo?.label || 'Obra Literaria'}
                </span>

                <h1 className={`text-3xl sm:text-5xl font-serif font-bold leading-tight mb-4 ${
                  isDark ? 'text-amber-50' : 'text-stone-900'
                }`}>
                  {story?.title}
                </h1>

                <div className={`flex items-center justify-center gap-2 font-serif text-sm italic ${
                  isDark ? 'text-slate-400' : 'text-stone-600'
                }`}>
                  <span>Por</span>
                  <span className={`font-semibold not-italic ${isDark ? 'text-slate-200' : 'text-stone-900'}`}>
                    {story?.author || 'Anónimo'}
                  </span>
                  {story?.createdAt && (
                    <>
                      <span>•</span>
                      <span>{new Date(story.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}</span>
                    </>
                  )}
                </div>
              </header>

              {/* Portada Decorativa (opcional dentro de la lectura) */}
              {story?.cover && (
                <div className="px-6 sm:px-16 pt-8 flex justify-center">
                  {/* La misma tapa del listado, al ancho de un libro en la
                      mano. Antes era un `max-w-md` con `max-h-[400px]` y sin
                      proporción fija: la imagen entraba a su tamaño natural y
                      el contenedor le cortaba lo que sobrara por abajo, así que
                      cada portada se recortaba por un sitio distinto. */}
                  <div className="relative aspect-[2/3] w-40 sm:w-48 rounded-l-xs rounded-r-lg overflow-hidden shadow-lg border border-stone-200/30 dark:border-slate-800">
                    <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 left-2.5 w-px bg-white/15 z-10 pointer-events-none" />
                    <img
                      src={story.cover}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Sinopsis / Prefacio */}
              {story?.description && (
                <div className="px-6 sm:px-16 pt-8 pb-4">
                  <div className={`p-6 rounded-lg text-sm sm:text-base font-serif italic leading-relaxed border-l-2 ${
                    isDark
                      ? 'bg-slate-900/50 border-amber-500/40 text-slate-300'
                      : 'bg-amber-50/40 border-amber-600/40 text-stone-700'
                  }`}>
                    <p className="font-sans text-xs font-bold uppercase tracking-wider not-italic mb-2 opacity-60">Sinopsis</p>
                    {story.description}
                  </div>
                </div>
              )}

              {/* CUERPO TEXTUAL LITERARIO */}
              {story?.content && (
                <section className="px-6 sm:px-20 py-10">
                  <div
                    className={`prose dark:prose-invert max-w-none font-serif text-base sm:text-lg leading-relaxed text-justify space-y-6 rounded-lg transition-colors ${
                      highContrast
                        ? isDark
                          ? 'bg-black text-white p-6 -mx-6'
                          : 'bg-white text-black p-6 -mx-6 border border-stone-900/10'
                        : isDark ? 'text-slate-300' : 'text-stone-800'
                    }`}
                    style={readingContentStyle({ fontScale, dyslexiaFont })}
                  >
                    {/* Render de párrafos con primera letra capitular */}
                    {story.content.split('\n\n').map((paragraph, index) => {
                      if (!paragraph.trim()) return null;
                      if (index === 0) {
                        return (
                          <p key={index} className="first-letter:float-left first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:mr-3 first-letter:leading-none first-letter:text-amber-600 dark:first-letter:text-amber-400">
                            {paragraph}
                          </p>
                        );
                      }
                      return <p key={index}>{paragraph}</p>;
                    })}
                  </div>
                </section>
              )}

              {/* VISOR DE DOCUMENTO PDF */}
              {story?.pdfUrl && (
                <section className="px-4 sm:px-12 py-8 border-t border-stone-200/60 dark:border-slate-800">
                  <div className={`rounded-xl overflow-hidden border shadow-sm ${
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-stone-100'
                  }`}>
                    <header className={`flex items-center justify-between p-4 border-b ${
                      isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-white'
                    }`}>
                      <span className="text-xs font-serif font-medium opacity-80">Documento adjunto (PDF)</span>
                      <button
                        onClick={handleDownload}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-stone-900 text-stone-100 hover:bg-stone-800'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    </header>

                    <div className="flex justify-center p-4 overflow-x-auto min-h-[400px]">
                      <Document
                        file={story.pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        error={<p className="text-xs py-8 text-rose-500">Error al cargar la vista previa del PDF.</p>}
                        loading={<p className="text-xs py-8 animate-pulse">Cargando páginas...</p>}
                      >
                        <Page pageNumber={currentPdfPage} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                    </div>

                    {/* Paginador PDF */}
                    <nav className={`flex items-center justify-between p-3 border-t text-xs ${
                      isDark ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-white'
                    }`}>
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPdfPage === 1}
                        className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="font-serif">Página {currentPdfPage} de {totalPages}</span>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPdfPage === totalPages}
                        className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </nav>
                  </div>
                </section>
              )}

              {/* BARRA DE ACCIONES E INTERACCIÓN (AL FINAL DEL TEXTO) */}
              <footer className={`px-6 sm:px-16 py-8 border-t flex flex-wrap items-center justify-between gap-4 ${
                isDark ? 'border-slate-800 bg-slate-950/30' : 'border-stone-200/60 bg-stone-50/50'
              }`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleToggleLike}
                    disabled={likeLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-serif text-xs font-semibold transition-all ${
                      story?.likesCount > 0
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${story?.likesCount > 0 ? 'fill-rose-500' : ''}`} />
                    <span>{story?.likesCount || 0} Me gusta</span>
                  </button>
                </div>

                <div className={`flex items-center gap-6 text-xs font-serif ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {story?.views || 0} lecturas</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {story?.totalComments || 0} opiniones</span>
                </div>
              </footer>
            </article>

            {/* SECCIONES COMPLEMENTARIAS (VALORACIÓN Y COMENTARIOS) */}
            <div className="mt-12 space-y-8">
              {/* Sección Calificación */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-stone-200'
              }`}>
                <LiteraryRatings
                  workId={selectedWork.id}
                  ratings={selectedWork.ratings || []}
                  averageRating={selectedWork.averageRating || 0}
                  isDark={isDark}
                  onRatingAdded={handleRatingAdded}
                />
              </div>

              {/* Sección Comentarios */}
              <div className={`p-6 sm:p-8 rounded-xl border shadow-sm ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-stone-200'
              }`}>
                <LiteraryComments
                  workId={selectedWork.id}
                  comments={selectedWork.comments || []}
                  isDark={isDark}
                  onCommentAdded={handleCommentAdded}
                  authorId={selectedWork.authorId}
                />
              </div>

            </div>
              </div>

              {/* Los mismos autores destacados del listado. En móvil baja
                  debajo del texto. */}
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-24">
                  <FeaturedAuthors isDark={isDark} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
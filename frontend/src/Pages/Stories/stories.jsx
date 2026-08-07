import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  Heart, MessageCircle, Share2, Download, ChevronLeft, ChevronRight, BookOpen, Eye, ArrowLeft, Bookmark,
  Feather, BookMarked, ScrollText, Drama, Newspaper, UserRound, Quote, NotebookPen, Palette, Library,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getApprovedWorks, toggleWorkLike, getWorkById } from '../../services/api';
import genresData from '../../config/genres.json';
import LiteraryComments from '../../components/LiteraryComments';
import LiteraryRatings from '../../components/LiteraryRatings';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const WORKS_PER_PAGE = 12;

// Icono de línea por género: sustituye a los emojis para mantener la estética editorial.
const GENRE_ICONS = {
  cuento: BookOpen,
  'poesía': Feather,
  novela: BookMarked,
  ensayo: ScrollText,
  drama: Drama,
  'crónica': Newspaper,
  'biografía': UserRound,
  microrrelato: Quote,
  cuaderno: NotebookPen,
  otro: Palette,
};

const getGenreIcon = (genre) => GENRE_ICONS[genre] || BookOpen;

export default function Stories() {
  const { isDark } = useContext(ThemeContext);
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [likeLoading, setLikeLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
        setWorks(response.works);
        setSelectedWork(null);
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

  // Obras publicadas por cada género del catálogo de creación.
  const genreCounts = useMemo(() => {
    return works.reduce((acc, work) => {
      acc[work.genre] = (acc[work.genre] || 0) + 1;
      return acc;
    }, {});
  }, [works]);

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
        setSelectedWork(prev => ({
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
      setSelectedWork(prev => ({
        ...prev,
        comments: (prev.comments || []).filter(c => c.id !== commentId),
        totalComments: (prev.totalComments || 0) - 1,
      }));
    } else if (action === 'like' && comment) {
      setSelectedWork(prev => ({
        ...prev,
        comments: (prev.comments || []).map(c => c.id === commentId ? comment : c),
      }));
    } else {
      setSelectedWork(prev => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
        totalComments: (prev.totalComments || 0) + 1,
      }));
    }
  };

  const handleRatingAdded = (newAverage) => {
    setSelectedWork(prev => ({
      ...prev,
      averageRating: newAverage,
    }));
  };

  const handleSelectWork = async (work) => {
    try {
      const response = await getWorkById(work.id);
      if (response.ok) {
        setSelectedWork(response.work);
      }
    } catch (err) {
      console.error('Error cargando obra:', err);
      setSelectedWork(work);
    }
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
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#faf7f2] text-stone-900'
    }`}>
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 py-8 sm:py-12">
        {!selectedWork ? (
          /* =================================================================== */
          /* GALERÍA LITERARIA (VISTA MOSAICO)                                  */
          /* =================================================================== */
          <div className="max-w-6xl mx-auto">
            {/* Encabezado Principal */}
            <header className="mb-10 text-center sm:text-left">
              <h1 className={`text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-3 ${isDark ? 'text-amber-100' : 'text-stone-900'}`}>
                Biblioteca de Literatura
              </h1>
              <p className={`text-base sm:text-lg max-w-2xl font-serif italic ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                Explora manuscritos, relatos y creaciones literarias de autores independientes.
              </p>
            </header>

            {/* Filtros por Género: catálogo completo del formulario de publicación */}
            <nav className={`mb-12 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
              <div className="flex flex-wrap gap-x-1.5 gap-y-2">
                {[{ value: 'all', label: 'Todas', icon: Library, count: works.length, description: 'El catálogo completo' }]
                  .concat(genresData.genres.map(genre => ({
                    value: genre.value,
                    label: genre.label,
                    icon: getGenreIcon(genre.value),
                    count: genreCounts[genre.value] || 0,
                    description: genre.description,
                  })))
                  .map(({ value, label, icon: Icon, count, description }) => {
                    const isActive = selectedGenre === value;
                    const isEmpty = count === 0;
                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedGenre(value)}
                        disabled={isEmpty}
                        title={description}
                        aria-current={isActive ? 'true' : undefined}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-serif whitespace-nowrap transition-all duration-200 ${
                          isEmpty
                            ? isDark
                              ? 'border-transparent text-slate-700 cursor-not-allowed'
                              : 'border-transparent text-stone-300 cursor-not-allowed'
                            : isActive
                            ? isDark
                              ? 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                              : 'border-stone-900 bg-stone-900 text-stone-50'
                            : isDark
                            ? 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                            : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        <span>{label}</span>
                        <span className={`text-[11px] font-sans tabular-nums ${isActive ? 'opacity-70' : 'opacity-45'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </nav>

            {/* Grid de Libros / Portadas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {paginatedWorks.map((work) => {
                const genre = getGenreInfo(work.genre);
                return (
                  <div
                    key={work.id}
                    onClick={() => {
                      handleSelectWork(work);
                      setCurrentPdfPage(1);
                    }}
                    className="group cursor-pointer flex flex-col transition-transform duration-300 hover:-translate-y-1.5"
                  >
                    {/* Estructura de Portada estilo Libro Impreso */}
                    <div className={`relative rounded-md overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 border ${
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-stone-100'
                    }`} style={{ aspectRatio: '2/3' }}>

                      {/* Simulación del lomo de un libro (Sombra lateral izquierda) */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent z-10 pointer-events-none" />

                      {work.cover ? (
                        <img
                          src={work.cover}
                          alt={work.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full p-6 flex flex-col justify-between ${
                          isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-amber-100/50 to-stone-200'
                        }`}>
                          <BookOpen className={`w-8 h-8 ${isDark ? 'text-amber-400/60' : 'text-stone-700/60'}`} />
                          <h3 className={`font-serif text-base font-bold line-clamp-3 leading-snug ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                            {work.title}
                          </h3>
                        </div>
                      )}

                      {/* Info emergente suave al pasar el mouse */}
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white z-20">
                        <span className="text-xs uppercase tracking-wider text-amber-300 font-sans mb-1">{genre?.label}</span>
                        <h4 className="font-serif font-bold text-sm line-clamp-2">{work.title}</h4>
                        <p className="text-xs text-slate-300 mt-1">{work.author || 'Anónimo'}</p>
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

                      <div className={`flex items-center gap-3 text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{work.views || 0}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{work.totalRatings || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{work.totalComments || 0}</span>
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
        ) : (
          /* =================================================================== */
          /* VISTA DE LECTURA (EXPERIENCIA EDITORIAL ENFOCADA)                  */
          /* =================================================================== */
          <div className="max-w-4xl mx-auto">
            {/* Barra de navegación superior */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedWork(null);
                  setCurrentPdfPage(1);
                }}
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

            {/* CONTENEDOR TIPO HOJA DE LIBRO (CANVAS DE LECTURA) */}
            <article className={`rounded-xl shadow-xl border transition-all duration-300 overflow-hidden ${
              isDark
                ? 'bg-[#12151e] border-slate-800 text-slate-200 shadow-black/50'
                : 'bg-[#fdfcf9] border-stone-200/80 text-stone-900 shadow-stone-900/5'
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
                <div className="px-6 sm:px-16 pt-8">
                  <div className="max-w-md mx-auto rounded-lg overflow-hidden shadow-lg border border-stone-200/30 dark:border-slate-800 max-h-[400px]">
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
                  <div className={`prose dark:prose-invert max-w-none font-serif text-base sm:text-lg leading-relaxed text-justify space-y-6 ${
                    isDark ? 'text-slate-300' : 'text-stone-800'
                  }`}>
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
        )}
      </main>

      <Footer />
    </div>
  );
}
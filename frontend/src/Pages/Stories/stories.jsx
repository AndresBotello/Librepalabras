import React, { useState, useContext, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Download, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getApprovedWorks, toggleWorkLike } from '../../services/api';
import genresData from '../../config/genres.json';
import LiteraryComments from '../../components/LiteraryComments';
import LiteraryRatings from '../../components/LiteraryRatings';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

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

  useEffect(() => {
    loadWorks();
  }, []);

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

  const getGenreInfo = (genre) => {
    return genresData.genres.find(g => g.value === genre);
  };

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

  const filteredWorks = selectedGenre === 'all'
    ? works
    : works.filter(w => w.genre === selectedGenre);

  const uniqueGenres = [...new Set(works.map(w => w.genre))];

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className={`p-8 rounded-lg text-center max-w-md ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {error}
            </p>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
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
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950' : 'bg-gradient-to-br from-amber-50 via-white to-orange-50'}`}>
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 py-8 sm:py-12">
        {!selectedWork ? (
          // GALERÍA LITERARIA
          <div className="max-w-6xl mx-auto">
            {/* Encabezado elegante */}
            <div className="mb-12 relative">
              <div className={`absolute top-0 left-0 w-1 h-12 ${isDark ? 'bg-amber-600' : 'bg-amber-700'}`} />
              <div className="pl-6">
                <h1 className={`text-4xl sm:text-5xl font-serif font-bold mb-2 ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                  Biblioteca de Historias
                </h1>
                <p className={`text-sm italic ${isDark ? 'text-amber-200 opacity-75' : 'text-amber-800 opacity-75'}`}>
                  Obras literarias que inspiran, emocionan y transforman
                </p>
              </div>
            </div>

            {/* Filtros literarios */}
            {uniqueGenres.length > 1 && (
              <div className="mb-10 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGenre('all')}
                  className={`px-4 py-2 rounded-sm text-sm font-serif font-semibold transition-all border-2 ${
                    selectedGenre === 'all'
                      ? isDark
                        ? 'bg-amber-900 border-amber-600 text-amber-100'
                        : 'bg-amber-100 border-amber-700 text-amber-900'
                      : isDark
                      ? 'border-gray-700 text-gray-400 hover:border-amber-700 hover:text-amber-200'
                      : 'border-gray-300 text-gray-700 hover:border-amber-700 hover:text-amber-900'
                  }`}
                >
                  Todas las obras
                </button>
                {uniqueGenres.map(genre => {
                  const info = getGenreInfo(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-4 py-2 rounded-sm text-sm font-serif font-semibold transition-all border-2 ${
                        selectedGenre === genre
                          ? isDark
                            ? 'bg-amber-900 border-amber-600 text-amber-100'
                            : 'bg-amber-100 border-amber-700 text-amber-900'
                          : isDark
                          ? 'border-gray-700 text-gray-400 hover:border-amber-700 hover:text-amber-200'
                          : 'border-gray-300 text-gray-700 hover:border-amber-700 hover:text-amber-900'
                      }`}
                    >
                      {info?.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grid literario - compacto */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredWorks.map((work) => {
                const genre = getGenreInfo(work.genre);
                return (
                  <button
                    key={work.id}
                    onClick={() => {
                      setSelectedWork(work);
                      setCurrentPdfPage(1);
                    }}
                    className={`group cursor-pointer transition-all duration-200 hover:scale-105 text-left`}
                  >
                    {/* Portada estilo libro - compacta */}
                    <div className={`relative rounded-sm overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-200 border ${
                      isDark
                        ? 'border-amber-800 bg-gray-800'
                        : 'border-amber-600 bg-gray-100'
                    }`}
                    style={{
                      aspectRatio: '3/4'
                    }}>
                      {work.cover ? (
                        <>
                          <img
                            src={work.cover}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* Overlay degradado */}
                          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black/80 to-transparent' : 'from-black/60 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300` }/>
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${isDark ? 'from-amber-900 to-yellow-900' : 'from-amber-200 to-orange-200'} flex flex-col items-center justify-center text-center p-4`}>
                          <BookOpen className={`w-8 h-8 mb-2 ${isDark ? 'text-amber-300' : 'text-amber-700'} opacity-60`} />
                          <span className={`text-xs font-serif italic ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                            {work.title}
                          </span>
                        </div>
                      )}

                      {/* Info en la portada */}
                      <div className={`absolute bottom-0 left-0 right-0 p-1.5 ${isDark ? 'bg-gradient-to-t from-black/90' : 'bg-gradient-to-t from-black/70'}`}>
                        <h3 className={`font-serif font-bold text-xs line-clamp-1 mb-0.5 ${isDark ? 'text-amber-100' : 'text-amber-50'}`}>
                          {work.title}
                        </h3>
                        <p className={`text-xs opacity-70 ${isDark ? 'text-amber-200/70' : 'text-amber-50/70'}`}>
                          {work.author || 'Anónimo'}
                        </p>
                      </div>
                    </div>

                    {/* Info bajo la portada */}
                    <div className="mt-1">
                      <span className={`inline-block text-xs font-serif px-1.5 py-0.5 rounded-sm mb-0.5 ${
                        isDark
                          ? 'bg-amber-900/50 text-amber-200'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {genre?.label}
                      </span>

                      {/* Estadísticas */}
                      <div className={`flex gap-2 text-xs pt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5" />
                          <span>{work.totalRatings || 0}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>{work.totalComments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // LECTURA - VISTA LITERARIA
          <div className="max-w-3xl mx-auto w-full">
            <button
              onClick={() => {
                setSelectedWork(null);
                setCurrentPdfPage(1);
              }}
              className={`mb-6 text-sm font-serif font-semibold transition-all ${
                isDark
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-800 hover:text-amber-600'
              }`}
            >
              ← Volver a la biblioteca
            </button>

            <article className={`${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {/* Decoración superior */}
              <div className="text-center mb-6">
                <div className={`text-2xl mb-4 ${isDark ? 'text-amber-600' : 'text-amber-700'}`}>
                  ✦
                </div>
              </div>

              {/* Encabezado del autor - literario */}
              <header className="text-center mb-8 pb-5 border-b-2 border-double" style={{
                borderColor: isDark ? '#7c2d12' : '#b45309'
              }}>
                <div className="mb-3">
                  <p className={`text-xs font-serif italic opacity-75 mb-1 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    Por
                  </p>
                  <p className={`text-xl font-serif font-bold ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                    {story?.author || 'Anónimo'}
                  </p>
                </div>
                <div className="flex justify-center gap-3 items-center text-xs">
                  <span className={`font-serif px-2 py-0.5 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    {genreInfo?.label}
                  </span>
                  <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {story?.createdAt ? new Date(story.createdAt).toLocaleDateString('es-CO') : ''}
                  </span>
                </div>
              </header>

              {/* Título - elegante */}
              <h1 className={`text-3xl sm:text-4xl font-serif font-bold mb-8 leading-tight text-center ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                {story?.title}
              </h1>

              {/* Portada elegante */}
              {story?.cover && (
                <figure className={`mb-8 rounded-sm overflow-hidden h-64 sm:h-80 border-4 shadow-2xl ${isDark ? 'border-amber-900' : 'border-amber-700'}`}>
                  <img
                    src={story.cover}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </figure>
              )}

              {/* Acciones literarias */}
              <div className={`flex justify-center gap-6 mb-8 pb-6 border-b-2 border-double ${isDark ? 'border-amber-900' : 'border-amber-700'}`}>
                <button className={`flex flex-col items-center gap-1 text-xs font-serif transition-all group ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-900 hover:text-amber-700'}`}>
                  <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">{story?.totalRatings || 0}</span>
                  <span className="text-xs opacity-60">favoritos</span>
                </button>
                <button className={`flex flex-col items-center gap-1 text-xs font-serif transition-all group ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-900 hover:text-amber-700'}`}>
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs">{story?.totalComments || 0}</span>
                  <span className="text-xs opacity-60">comentarios</span>
                </button>
                <button className={`flex flex-col items-center gap-1 text-xs font-serif transition-all group ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-900 hover:text-amber-700'}`}>
                  <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs opacity-60">compartir</span>
                </button>
              </div>

              {/* Descripción - sinopsis elegante */}
              {story?.description && (
                <section className="mb-8">
                  <p className={`text-xs italic opacity-75 mb-4 text-center ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    Sinopsis
                  </p>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap font-serif ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    {story.description}
                  </p>
                </section>
              )}

              {/* Contenido - Lectura */}
              {story?.content && (
                <section className="mb-8">
                  <div className="text-center mb-4">
                    <div className={`text-xl mb-3 ${isDark ? 'text-amber-600' : 'text-amber-700'}`}>
                      ✦
                    </div>
                  </div>
                  <pre className={`font-serif text-sm leading-relaxed whitespace-pre-wrap break-words text-justify ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {story.content}
                  </pre>
                  <div className="text-center mt-4">
                    <div className={`text-xl ${isDark ? 'text-amber-600' : 'text-amber-700'}`}>
                      ✦
                    </div>
                  </div>
                </section>
              )}

              {/* PDF - Descarga */}
              {story?.pdfUrl ? (
                <section className={`rounded-sm border-2 mb-8 overflow-hidden ${isDark ? 'border-amber-900 bg-gray-900' : 'border-amber-700 bg-amber-50'}`}>
                  <header className={`flex items-center justify-between p-4 border-b-2 border-double ${isDark ? 'border-amber-900' : 'border-amber-700'}`}>
                    <div>
                      <p className={`text-xs font-serif italic ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                        Descarga la edición completa
                      </p>
                      <span className={`text-sm font-serif font-bold ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                        {story.title}.pdf
                      </span>
                    </div>
                    <button
                      onClick={handleDownload}
                      className={`p-2 rounded-sm font-serif font-bold transition-all ${isDark ? 'bg-amber-900 text-amber-100 hover:bg-amber-800' : 'bg-amber-700 text-amber-50 hover:bg-amber-800'}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </header>

                  <div className={`w-full overflow-auto ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className="flex justify-center p-3">
                      <Document
                        file={story.pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        error={<p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Error cargando PDF</p>}
                        loading={<p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando...</p>}
                      >
                        <Page pageNumber={currentPdfPage} />
                      </Document>
                    </div>
                  </div>

                  <nav className={`flex items-center justify-between p-3 border-t-2 border-double ${isDark ? 'border-amber-900 bg-gray-900' : 'border-amber-700 bg-amber-50'}`}>
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPdfPage === 1}
                      className={`p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-900 hover:text-amber-700'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className={`text-xs font-serif ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                      {currentPdfPage} de {totalPages}
                    </span>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPdfPage === totalPages}
                      className={`p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all ${isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-900 hover:text-amber-700'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </section>
              ) : (
                <section className={`rounded-sm border-2 p-4 text-center mb-8 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-xs font-serif ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Lectura en línea no disponible
                  </p>
                </section>
              )}

              {/* Botón de like para la obra */}
              <div className="mb-8">
                <button
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    story?.likesCount > 0
                      ? isDark
                        ? 'bg-red-900 text-red-200 hover:bg-red-800'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                      : isDark
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {story?.likesCount > 0 ? '❤️' : '🤍'} {story?.likesCount || 0} Me gusta
                </button>
              </div>

              {/* Ratings */}
              {selectedWork && (
                <div className="mb-8">
                  <LiteraryRatings
                    workId={selectedWork.id}
                    ratings={selectedWork.ratings || []}
                    averageRating={selectedWork.averageRating || 0}
                    isDark={isDark}
                    onRatingAdded={handleRatingAdded}
                  />
                </div>
              )}

              {/* Comentarios */}
              {selectedWork && (
                <div className="mb-8">
                  <LiteraryComments
                    workId={selectedWork.id}
                    comments={selectedWork.comments || []}
                    isDark={isDark}
                    onCommentAdded={handleCommentAdded}
                    authorId={selectedWork.authorId}
                  />
                </div>
              )}
            </article>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

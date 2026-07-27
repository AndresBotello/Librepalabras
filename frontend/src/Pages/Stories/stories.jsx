import React, { useState, useContext } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';

export default function Stories() {
  const { isDark } = useContext(ThemeContext);
  const [liked, setLiked] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [announcement, setAnnouncement] = useState('');
  const [likeCount, setLikeCount] = useState(1100);

  const story = {
    id: 1,
    title: 'El Renacer de la Imprenta Digital',
    author: 'Elena Rodríguez',
    date: '14 de Noviembre, 2023',
    dateISO: '2023-11-14',
    image: 'https://res.cloudinary.com/dtuyckctv/image/upload/v1785047698/8ae42f67-b81e-4b71-a438-4b1b30f96450_tijdbo.webp',
    likes: 1100,
    comments: 342,
    shares: 0,
    description: `En las calles de Valledupar, donde el acordeón suele ser el protagonista asoleado de la narrativa sonora, ha comenzado a emerger una corriente distinta, silenciosa pero profunda, la poesía del César, un movimiento que rescata la tradición oral de la región pero la traslada a las páginas blancas con una sofisticación contemporánea que se alterna la prosa y la vertiente.

Los jóvenes poetas no sólo canten a Valledupar o a los legendarios amores vallenatos, explorarán la identidad, la diáspora, y el conflicto interno de una generación que se debate entre la tradición de sus abuelos y la globalización digital. Esta encontrando en espacios como Liberapalabras el eco necesario para llevar a una audiencia que tiene sed de historias locales.

"La palabra es el César es como el agua del río siempre fluye, a veces calma y a veces turbulenta, pero siempre vital para encender génesis mas recia."`,
    pdfTitle: 'Cartografías_del_Silencio_Fragmentos.pdf',
    pdfPages: 10,
    suggestedReads: [
      {
        id: 1,
        title: 'El Surrealismo en la Pintura del Caribe',
        author: 'Arturo Martínez',
        image: 'https://res.cloudinary.com/dtuyckctv/image/upload/v1785047698/8ae42f67-b81e-4b71-a438-4b1b30f96450_tijdbo.webp',
        category: 'Arte'
      },
      {
        id: 2,
        title: 'Antología de la Crítica Vallenata: 1950-2000',
        author: 'Lucía García-Ruiz',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=250&fit=crop',
        category: 'Crítica'
      },
      {
        id: 3,
        title: 'Debate: ¿Hacia dónde va la novela histórica en Colombia?',
        author: 'Moderado por Carlos Ruiz',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=250&fit=crop',
        category: 'Debate'
      }
    ],
    authorInfo: {
      name: 'Elena Rodríguez',
      bio: 'Escritora y periodista cultural nacida en Valledupar. Ha sido galardonada en el Premio Nacional de Literatura y la Revista Poliversia. Sus artículos del lenguaje y la música regional.',
      followers: '1.2k',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    }
  };

  const categories = ['Todos', 'Cultura Vallenata', 'Ensayos', 'Reseña Literaria', 'Caso Literario'];

  // Manejador de like accesible
  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);

    if (newLikedState) {
      setLikeCount(likeCount + 1);
      setAnnouncement(`Has marcado "${story.title}" como me gusta. Ahora tiene ${likeCount + 1} likes.`);
    } else {
      setLikeCount(likeCount - 1);
      setAnnouncement(`Has desmarcado "${story.title}" de me gusta. Ahora tiene ${likeCount - 1} likes.`);
    }
  };

  // Manejador de compartir
  const handleShare = () => {
    setAnnouncement(`Link de "${story.title}" copiado al portapapeles.`);
  };

  // Manejador de descarga
  const handleDownload = () => {
    setAnnouncement(`Descargando ${story.pdfTitle}...`);
  };

  // Manejador de categoría
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setAnnouncement(`Filtro de categoría cambiado a: ${category}`);
  };

  // Manejador de navegación de PDF
  const goToPreviousPage = () => {
    const newPage = Math.max(1, currentPdfPage - 1);
    setCurrentPdfPage(newPage);
    setAnnouncement(`Página del PDF: ${newPage} de ${story.pdfPages}`);
  };

  const goToNextPage = () => {
    const newPage = Math.min(story.pdfPages, currentPdfPage + 1);
    setCurrentPdfPage(newPage);
    setAnnouncement(`Página del PDF: ${newPage} de ${story.pdfPages}`);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      {/* Skip Link - Salta al contenido principal */}
      <a
        href="#main-content"
        className="skip-link"
        aria-label="Saltar al contenido principal"
      >
        Saltar al contenido principal
      </a>

      <Navbar />

      {/* Anuncio para lectores de pantalla */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12"
      >
        {/* Article Header */}
        <article
          aria-label={`Artículo: ${story.title} por ${story.author}`}
        >
          {/* Author Info Header */}
          <header
            className={`flex items-center justify-between mb-8 pb-6 border-b transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            role="doc-pageheader"
          >
            <div className="flex items-center gap-4">
              <img
                src={story.authorInfo.image}
                alt={`Foto de perfil de ${story.author}`}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p
                  className={`font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                  aria-label={`Escrito por ${story.author}`}
                >
                  {story.author}
                </p>
                <time
                  className={`text-xs transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  dateTime={story.dateISO}
                  aria-label={`Publicado el ${story.date}`}
                >
                  {story.date}
                </time>
              </div>
            </div>

            {/* More Options Button */}
            <button
              aria-label="Más opciones para esta historia"
              className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>

          {/* Title */}
          <h1
            id="story-title"
            className={`text-4xl sm:text-5xl font-bold mb-8 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
          >
            {story.title}
          </h1>

          {/* Featured Image */}
          <figure className="mb-8 rounded-lg overflow-hidden h-64 sm:h-96">
            <img
              src={story.image}
              alt={`Portada del artículo "${story.title}" escrito por ${story.author}`}
              className="w-full h-full object-cover"
            />
            <figcaption className="sr-only">
              Portada del artículo {story.title}
            </figcaption>
          </figure>

          {/* Actions - Grupo de botones accesible */}
          <div
            className={`flex gap-6 mb-8 pb-8 border-b transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            role="group"
            aria-label="Acciones para este artículo"
          >
            {/* Like Button */}
            <button
              onClick={handleLike}
              aria-label={
                liked
                  ? `Desmarcar artículo "${story.title}" como favorito`
                  : `Marcar artículo "${story.title}" como favorito`
              }
              aria-pressed={liked}
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${
                isDark ? 'focus:ring-offset-gray-950' : 'focus:ring-offset-white'
              } ${
                liked
                  ? 'text-red-500 bg-red-900 bg-opacity-20'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              <span aria-live="polite" aria-atomic="true">
                {likeCount}
              </span>
            </button>

            {/* Comments Button */}
            <button
              aria-label={`Ver ${story.comments} comentarios del artículo "${story.title}"`}
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                isDark ? 'focus:ring-offset-gray-950' : 'focus:ring-offset-white'
              } ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              <span>{story.comments}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              aria-label={`Compartir artículo "${story.title}"`}
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${
                isDark ? 'focus:ring-offset-gray-950' : 'focus:ring-offset-white'
              } ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Share2 className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Compartir</span>
            </button>
          </div>

          {/* Description */}
          <section
            id="story-description"
            className={`prose prose-sm max-w-none mb-12 transition-colors ${isDark ? 'prose-invert' : ''}`}
            aria-labelledby="story-title"
          >
            <p className={`text-base leading-relaxed whitespace-pre-wrap transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {story.description}
            </p>
          </section>

          {/* PDF Viewer Section */}
          <section
            className={`rounded-lg border mb-12 overflow-hidden transition-colors ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
            aria-label="Visor de documento PDF"
          >
            {/* PDF Header */}
            <header
              className={`flex items-center justify-between p-4 border-b transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl"
                  aria-hidden="true"
                >
                  📄
                </span>
                <span
                  className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {story.pdfTitle}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs font-semibold transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  aria-label={`Progreso del documento: 100 por ciento`}
                >
                  100%
                </span>
                <button
                  onClick={handleDownload}
                  aria-label={`Descargar ${story.pdfTitle}`}
                  className={`p-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            {/* PDF Viewer Placeholder */}
            <div
              className={`w-full h-96 sm:h-[500px] flex items-center justify-center transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
              role="img"
              aria-label={`Página ${currentPdfPage} de ${story.pdfPages} del documento ${story.pdfTitle}`}
            >
              <div className="text-center">
                <div className={`text-4xl mb-4 transition-colors ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  📄
                </div>
                <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Página {currentPdfPage} de {story.pdfPages}
                </p>
              </div>
            </div>

            {/* PDF Navigation */}
            <nav
              className={`flex items-center justify-between p-4 border-t transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
              aria-label="Navegación del documento PDF"
            >
              <button
                onClick={goToPreviousPage}
                disabled={currentPdfPage === 1}
                aria-label={`Página anterior. Actualmente en página ${currentPdfPage} de ${story.pdfPages}`}
                className={`p-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <span
                className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                aria-live="polite"
                aria-atomic="true"
              >
                Página {currentPdfPage} de {story.pdfPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPdfPage === story.pdfPages}
                aria-label={`Página siguiente. Actualmente en página ${currentPdfPage} de ${story.pdfPages}`}
                className={`p-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </nav>
          </section>

          {/* Categories Filter */}
          <section className="mb-12" aria-label="Filtrar por categoría">
            <nav
              className="flex gap-2 overflow-x-auto pb-2"
              role="tablist"
              aria-label="Categorías de historias"
            >
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  role="tab"
                  aria-selected={selectedCategory === category}
                  aria-label={`Filtrar por categoría: ${category}`}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    selectedCategory === category
                      ? 'bg-[#5D4037] text-white ring-2 ring-yellow-400'
                      : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </section>

          {/* Suggested Reads */}
          <section className="mb-12" aria-labelledby="suggested-heading">
            <div className="flex items-center justify-between mb-8">
              <h2
                id="suggested-heading"
                className={`text-2xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
              >
                Lecturas Sugeridas
              </h2>
              <a
                href="#"
                className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800' : 'text-yellow-600 hover:text-yellow-700 hover:bg-gray-100'}`}
              >
                Explorar más →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
              {story.suggestedReads.map(read => (
                <article
                  key={read.id}
                  className={`group rounded-lg overflow-hidden transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-yellow-400 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
                  role="listitem"
                  aria-label={`Lectura sugerida: ${read.title} por ${read.author}`}
                >
                  <div className="overflow-hidden h-48">
                    <img
                      src={read.image}
                      alt={`Portada de "${read.title}" escrito por ${read.author}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}
                      aria-label={`Categoría: ${read.category}`}
                    >
                      {read.category}
                    </span>

                    <h3 className={`text-lg font-bold mb-2 mt-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {read.title}
                    </h3>

                    <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Por {read.author}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Author Info */}
          <aside
            className={`rounded-lg border p-6 sm:p-8 transition-colors ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
            aria-label="Información del autor"
          >
            <div className="flex gap-4 mb-4">
              <img
                src={story.authorInfo.image}
                alt={`Foto de perfil de ${story.authorInfo.name}`}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-1 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Sobre {story.authorInfo.name}
                </h3>
                <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span aria-label={`${story.authorInfo.followers} seguidores`}>
                    {story.authorInfo.followers} seguidores
                  </span>
                </p>
              </div>
            </div>

            <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {story.authorInfo.bio}
            </p>

            <button
              aria-label={`Seguir a ${story.authorInfo.name}`}
              className={`px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'border-2 border-gray-600 text-gray-300 hover:bg-gray-800 focus:ring-offset-gray-900' : 'border-2 border-gray-300 text-gray-900 hover:bg-gray-100 focus:ring-offset-white'}`}
            >
              Seguir
            </button>
          </aside>
        </article>
      </main>

      <Footer />
    </div>
  );
}

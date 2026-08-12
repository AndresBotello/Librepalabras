import React, { useState, useContext, useEffect } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Sparkles,
  BookOpen,
  UserPlus,
  Send
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import SocialIcon from '../../components/SocialIcon';
import AuthorDetailModal from '../../components/AuthorDetailModal';
import { platformLabel } from '../../utils/socialLinks';
import { getAllAuthors } from '../../services/api';

export default function Authors() {
  const { isDark } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;
  
  // Qué autor tiene la ficha abierta. `null` = no hay modal.
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    try {
      const response = await getAllAuthors();
      if (response.ok && response.authors) {
        setAuthors(response.authors);
      }
    } catch (err) {
      console.error('Error cargando autores:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuthors = authors.filter(author => {
    const term = searchTerm.toLowerCase();
    return (
      author.name.toLowerCase().includes(term) ||
      author.role.toLowerCase().includes(term) ||
      (author.description && author.description.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredAuthors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuthors = filteredAuthors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-slate-50/50 text-gray-900'}`}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-8 border-b border-gray-200/50 dark:border-gray-800/50">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border transition-colors bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20">
                <Sparkles size={13} />
                Comunidad Literaria
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.15]">
                Nuestros Autores & <br />
                <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-rose-500 dark:from-amber-300 dark:via-amber-400 dark:to-rose-400">
                  Colaboradores
                </span>
              </h1>

              <p className={`text-base sm:text-lg mb-8 max-w-2xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Conoce a las mentes brillantes que dan vida a Liberapalabras. Desde novelistas consagrados hasta poetas emergentes, exploramos la diversidad literaria de nuestra región.
              </p>

              <div className="flex gap-4 flex-wrap">
                <button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                  <UserPlus size={16} />
                  Unirse como Colaborador
                </button>
                <button className={`px-6 py-3 rounded-xl text-sm font-medium transition-all border ${
                  isDark 
                    ? 'border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800 hover:border-gray-700' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400 shadow-sm'
                }`}>
                  Conocer el Proceso
                </button>
              </div>
            </div>

            {/* Right Featured Card/Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 opacity-20 group-hover:opacity-30 blur transition duration-500"></div>
                <div className={`relative rounded-2xl overflow-hidden h-72 sm:h-80 shadow-2xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <img
                    src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&fit=crop"
                    alt="Biblioteca con autores leyendo sus obras"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-5 -left-5 sm:-left-6 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Catálogo Activo</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">+100 Obras Publicadas</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Controls Bar (Search & Filter) */}
          <div className="mb-10 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre, especialidad o palabra clave..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-11 pr-10 py-3 text-sm rounded-xl font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isDark 
                    ? 'bg-gray-900/80 border-gray-800 text-gray-100 placeholder-gray-500 focus:border-amber-500/50' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm focus:border-amber-500/50'
                }`}
                aria-label="Buscar autores"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              className={`w-full sm:w-auto px-5 py-3 text-sm rounded-xl font-medium border transition-all flex items-center justify-center gap-2 ${
                isDark 
                  ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
              aria-label="Abrir opciones de filtro"
            >
              <SlidersHorizontal size={15} />
              <span>Filtros Avanzados</span>
            </button>
          </div>

          {/* Authors Grid */}
          <div id="authors-list" className="mb-12" role="list" aria-label="Lista de autores">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight font-serif">
                Directorio de Perfiles
              </h2>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {filteredAuthors.length} {filteredAuthors.length === 1 ? 'Autor' : 'Autores'}
              </span>
            </div>

            {loading ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mb-3" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cargando catálogo de autores...
                </p>
              </div>
            ) : paginatedAuthors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedAuthors.map(author => {
                  return (
                    <article
                      key={author.id}
                      className={`group relative rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between overflow-hidden ${
                        isDark 
                          ? 'bg-gray-900/90 border-gray-800/80 hover:border-amber-500/40' 
                          : 'bg-white border-gray-200/80 hover:border-amber-500/30 shadow-sm'
                      }`}
                      role="listitem"
                      aria-label={`${author.name}, ${author.role}`}
                    >
                      {/* Top Header & Avatar */}
                      <div>
                        <div className="pt-7 pb-4 flex flex-col items-center px-5 relative">
                          {/* Category Badge overlayed upper right */}
                          {author.category && (
                            <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/20">
                              {author.category}
                            </span>
                          )}

                          {/* Avatar with Glow */}
                          <div className="relative mb-3">
                            <img
                              src={author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=300`}
                              alt={`Foto de perfil de ${author.name}`}
                              className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800 transition-all duration-300 group-hover:scale-105 group-hover:ring-amber-500/50 shadow-md"
                            />
                          </div>

                          {/* Name & Role */}
                          <h3 className="text-lg font-bold font-serif text-center truncate w-full px-2">
                            {author.name}
                          </h3>
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 text-center truncate w-full mb-3">
                            {author.role}
                          </p>
                        </div>

                        {/* Bio Section — solo un adelanto de tres líneas. La
                            biografía entera, con sus párrafos, se lee en el
                            modal de «Ver detalles». */}
                        <div className="px-5 pb-3">
                          <p className={`text-xs leading-relaxed whitespace-pre-line line-clamp-3 transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {author.description || 'Sin descripción disponible.'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Details & Actions */}
                      <div className="px-5 pb-5 pt-2">
                        {/* Tags */}
                        {author.tags && author.tags.length > 0 && (
                          <div className="flex gap-1.5 mb-4 flex-wrap">
                            {author.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                  isDark ? 'bg-gray-800/80 text-gray-400' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Links & Action Buttons */}
                        <div className="space-y-3">
                          {author.links?.length > 0 && (
                            <div className="flex items-center justify-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                              {author.links.map(link => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={platformLabel(link.url, link.label)}
                                  aria-label={`${platformLabel(link.url, link.label)} de ${author.name}`}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark
                                      ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-800'
                                      : 'text-gray-500 hover:text-amber-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <SocialIcon url={link.url} size={15} />
                                </a>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedAuthor(author)}
                            aria-label={`Ver la ficha completa de ${author.name}`}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm shadow-amber-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                          >
                            <BookOpen size={13} />
                            <span>Ver detalles</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-16 px-6 rounded-2xl border border-dashed ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'}`}>
                {authors.length === 0 ? (
                  <>
                    <p className="text-base font-bold mb-1">Todavía no hay autores publicados</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Estamos preparando el directorio. Vuelve muy pronto.
                    </p>
                  </>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No encontramos autores que coincidan con tu búsqueda.
                  </p>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className={`p-2 rounded-xl transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'border-gray-800 hover:bg-gray-800 text-gray-300' 
                      : 'border-gray-200 hover:bg-gray-100 text-gray-700 shadow-sm'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`w-9 h-9 rounded-xl font-semibold text-xs transition-all ${
                      currentPage === page
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                        : isDark
                          ? 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className={`p-2 rounded-xl transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'border-gray-800 hover:bg-gray-800 text-gray-300' 
                      : 'border-gray-200 hover:bg-gray-100 text-gray-700 shadow-sm'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Banner Call To Action */}
          <section
            className={`relative overflow-hidden text-center py-12 px-6 rounded-3xl border transition-all ${
              isDark 
                ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800' 
                : 'bg-gradient-to-b from-white to-gray-50 border-gray-200/80 shadow-sm'
            }`}
            aria-labelledby="cta-heading"
          >
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} />
              </div>
              <h2
                id="cta-heading"
                className="text-2xl sm:text-3xl font-bold font-serif mb-3"
              >
                ¿Quieres compartir tu obra con nuestra comunidad?
              </h2>
              <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Buscamos constantemente voces frescas y perspectivas únicas de la región del Cesar y el Caribe colombiano. Únete a nuestro panel de colaboradores.
              </p>
              <button
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-8 py-3.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Send size={15} />
                Enviar Propuesta Editorial
              </button>
            </div>
          </section>

        </div>
      </main>

      <Footer />

      {selectedAuthor && (
        <AuthorDetailModal
          author={selectedAuthor}
          onClose={() => setSelectedAuthor(null)}
        />
      )}
    </div>
  );
}
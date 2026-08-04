import React, { useState, useContext, useEffect } from 'react';
import { Search, Bookmark, MessageCircle, ChevronRight, ChevronLeft, Heart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getAllAuthors } from '../../services/api';

export default function Authors() {
  const { isDark } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8; // Incrementado a 8 para adaptarse a la cuadrícula de 4 columnas

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

  // Filtrar autores solo por búsqueda
  const filteredAuthors = authors.filter(author => {
    const term = searchTerm.toLowerCase();
    return (
      author.name.toLowerCase().includes(term) ||
      author.role.toLowerCase().includes(term) ||
      (author.description && author.description.toLowerCase().includes(term))
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredAuthors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuthors = filteredAuthors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      {/* Hero Section */}
      <section className={`px-4 sm:px-8 py-10 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div>
              <p className={`text-xs font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Comunidad Literaria
              </p>
              <h1 className={`text-3xl md:text-4xl font-bold mb-4 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Nuestros Autores & <span className="italic font-playfair">Colaboradores</span>
              </h1>
              <p className={`text-sm sm:text-base mb-6 leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Conoce a las mentes brillantes que dan vida a Liberapalabras. Desde novelistas consagrados hasta poetas emergentes, exploramos la diversidad literaria de nuestra región.
              </p>

              <div className="flex gap-3 flex-wrap">
                <button className="bg-[#5D4037] hover:bg-[#4A302A] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  👤 Unirse como Colaborador
                </button>
                <button className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                  Conocer el Proceso
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className={`rounded-xl overflow-hidden h-60 shadow-xl transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&h=500&fit=crop"
                  alt="Biblioteca con autores leyendo sus obras"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge */}
              <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-gray-900 rounded-full p-3 font-bold text-center shadow-lg w-20 h-20 flex items-center justify-center">
                <span className="text-[11px] leading-tight">+100 OBRAS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={`flex-1 px-4 sm:px-8 py-10 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-8 flex flex-col sm:flex-row gap-3">
            <div className={`flex-1 relative transition-colors ${isDark ? 'bg-gray-900 border border-gray-800 rounded-lg' : 'bg-gray-100 rounded-lg'}`}>
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Busca por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'bg-gray-900 text-gray-100 placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-600'}`}
                aria-label="Buscar autores"
              />
            </div>

            <button
              className={`px-5 py-2.5 text-sm rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-label="Abrir opciones de filtro"
            >
              🔽 Filtros
            </button>
          </div>

          {/* Authors Grid - Tarjetas más compactas */}
          <div id="authors-list" className="mb-10" role="list" aria-label="Lista de autores">
            <h2 className={`text-2xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Directorio de Perfiles
            </h2>

            {loading ? (
              <div className={`text-center py-10 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cargando autores...
                </p>
              </div>
            ) : paginatedAuthors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedAuthors.map(author => (
                  <article
                    key={author.id}
                    className={`rounded-xl overflow-hidden transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-yellow-400 group flex flex-col justify-between ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
                    role="listitem"
                    aria-label={`${author.name}, ${author.role}`}
                  >
                    <div>
                      {/* Image Container: reducido a h-40 */}
                      <div className="relative overflow-hidden h-40">
                        <img
                          src={author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=300`}
                          alt={`Foto de perfil de ${author.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {author.category && (
                          <div className="absolute top-2.5 left-2.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-400 text-gray-900 shadow-sm">
                              {author.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content: padding reducido a p-4 */}
                      <div className="p-4">
                        <h3 className={`text-base font-bold mb-0.5 truncate transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {author.name}
                        </h3>
                        <p className={`text-xs font-semibold mb-2 truncate transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          {author.role}
                        </p>

                        <p className={`text-xs leading-relaxed mb-3 line-clamp-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {author.description || 'Sin descripción disponible'}
                        </p>

                        {/* Stats compactas */}
                        <div className={`flex gap-2 mb-3 py-2 px-3 rounded-lg border ${isDark ? 'bg-gray-950/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`} role="group" aria-label="Estadísticas">
                          <div className="text-center flex-1">
                            <p className={`text-sm font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                              {author.publications || 0}
                            </p>
                            <p className={`text-[10px] uppercase font-medium transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              Publicaciones
                            </p>
                          </div>
                          <div className={`w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                          <div className="text-center flex-1">
                            <p className={`text-sm font-bold flex items-center justify-center gap-1 transition-colors ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                              <Heart size={12} className="fill-current" />
                              {author.totalLikes || 0}
                            </p>
                            <p className={`text-[10px] uppercase font-medium transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              Me gusta
                            </p>
                          </div>
                        </div>

                        {/* Tags */}
                        {author.tags && author.tags.length > 0 && (
                          <div className="flex gap-1.5 mb-2 flex-wrap">
                            {author.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        aria-label={`Guardar perfil de ${author.name}`}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'border border-gray-700 text-gray-300 hover:bg-gray-800' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                      >
                        <Bookmark size={14} />
                        <span className="text-xs">Guardar</span>
                      </button>
                      <button
                        aria-label={`Contactar a ${author.name}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold bg-[#5D4037] text-white hover:bg-[#4A302A] transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        <MessageCircle size={14} />
                        <span className="text-xs">Contactar</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`text-center py-10 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No hay autores que coincidan con tu búsqueda.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className={`p-1.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`w-8 h-8 rounded-lg font-semibold text-xs transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      currentPage === page
                        ? 'bg-[#5D4037] text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className={`p-1.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <section
            className={`text-center py-10 px-6 rounded-xl transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}
            aria-labelledby="cta-heading"
          >
            <div className="text-3xl mb-2">📖</div>
            <h2
              id="cta-heading"
              className={`text-2xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
            >
              ¿Quieres compartir tu obra con nuestra comunidad?
            </h2>
            <p className={`text-sm mb-6 max-w-xl mx-auto transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Buscamos constantemente voces frescas y perspectivas únicas de la región del César y el Caribe colombiano. Únete a nuestro panel de colaboradores.
            </p>
            <button
              className="bg-[#5D4037] hover:bg-[#4A302A] text-white px-7 py-3 rounded-lg font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              Enviar Propuesta Editorial
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
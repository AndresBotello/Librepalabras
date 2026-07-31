import React, { useState, useContext, useEffect } from 'react';
import { Search, Heart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getApprovedWorks } from '../../services/api';

export default function Authors() {
  const { isDark } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    try {
      const response = await getApprovedWorks();
      if (response.ok && response.works) {
        // Extraer autores únicos
        const uniqueAuthors = {};
        response.works.forEach(work => {
          if (work.author && !uniqueAuthors[work.authorId]) {
            uniqueAuthors[work.authorId] = {
              id: work.authorId,
              name: work.author,
              role: work.genre ? work.genre.charAt(0).toUpperCase() + work.genre.slice(1) : 'Autor',
              description: work.authorDescription || null,
              photoURL: work.authorPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(work.author)}&background=random&size=300`,
              publications: response.works.filter(w => w.authorId === work.authorId).length,
              totalLikes: response.works.filter(w => w.authorId === work.authorId).reduce((sum, w) => sum + (w.likesCount || 0), 0),
            };
          }
        });
        setAuthors(Object.values(uniqueAuthors));
      }
    } catch (err) {
      console.error('Error cargando autores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar autores solo por búsqueda
  const filteredAuthors = authors.filter(author => {
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         author.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (author.description && author.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
      <Navbar />

      {/* Hero Section */}
      <section className={`relative py-24 px-4 sm:px-8 border-b transition-colors ${
        isDark ? 'bg-stone-950 border-stone-800' : 'bg-[#F4F0EA] border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400">
            Comunidad Literaria
          </span>
          <h1 className={`text-4xl sm:text-5xl font-serif font-bold mt-3 mb-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Todos Nuestros Autores
          </h1>
          <p className={`text-lg leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Conoce a los creadores, investigadores y pensadores que tejen la memoria literaria de nuestra región.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className={`flex-1 px-4 sm:px-8 py-16 transition-colors ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-16 max-w-2xl mx-auto">
            <div className={`relative transition-colors ${isDark ? 'bg-stone-900 border border-stone-800 rounded-lg' : 'bg-gray-100 rounded-lg'}`}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Busca por nombre, rol o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 ${isDark ? 'bg-stone-900 text-stone-100 placeholder-stone-500' : 'bg-gray-100 text-stone-900 placeholder-gray-600'}`}
                aria-label="Buscar autores"
              />
            </div>
          </div>

          {/* Authors Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className={isDark ? 'text-stone-400' : 'text-stone-600'}>Cargando autores...</p>
            </div>
          ) : filteredAuthors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredAuthors.map((author) => (
                <div
                  key={author.id}
                  className={`group relative p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between shimmer-card ${
                    isDark ? 'bg-stone-900/30 border-stone-800/80 hover:bg-stone-900/80 hover:border-amber-500/30' : 'bg-white border-stone-200 hover:shadow-2xl hover:shadow-stone-300/50'
                  }`}
                >
                  {/* Comilla decorativa */}
                  <div className={`absolute top-4 right-6 text-6xl font-serif leading-none select-none pointer-events-none opacity-20 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                    "
                  </div>

                  <div>
                    {/* Foto redonda con glow */}
                    <div className="relative w-28 h-28 mx-auto mb-8">
                      <div className={`absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${isDark ? 'bg-amber-500/30' : 'bg-amber-400/40'}`} />
                      <img
                        src={author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=300`}
                        alt={author.name}
                        className="relative w-full h-full object-cover rounded-full ring-2 ring-amber-500/30 group-hover:ring-amber-500 transition-all duration-500 grayscale group-hover:grayscale-0"
                      />
                    </div>

                    {/* Información */}
                    <span className="block text-center text-[10px] font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400 mb-3">
                      {author.role}
                    </span>
                    <h3 className={`text-xl font-serif font-bold text-center mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {author.name}
                    </h3>

                    {/* Descripción */}
                    {author.description && (
                      <p className={`text-sm text-center leading-relaxed mb-4 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        {author.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex gap-4 justify-center text-center py-4 border-t border-stone-500/20">
                      <div>
                        <p className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                          {author.publications || 0}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
                          Publicaciones
                        </p>
                      </div>
                      <div className="w-px bg-stone-500/20"></div>
                      <div>
                        <p className={`text-lg font-bold flex items-center justify-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          <Heart size={14} />
                          {author.totalLikes || 0}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
                          Me gusta
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón */}
                  <div className="text-center pt-4 mt-4 border-t border-stone-500/10">
                    <a
                      href="/stories"
                      className="text-xs font-bold tracking-wider uppercase text-stone-400 hover:text-amber-500 transition-colors duration-300 flex items-center justify-center gap-1 group-hover:gap-2"
                    >
                      Ver obras <span>→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className={isDark ? 'text-stone-400' : 'text-stone-600'}>
                No hay autores que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

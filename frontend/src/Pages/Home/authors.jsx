import React, { useState, useContext, useEffect } from 'react';
import { Search, Bookmark, MessageCircle, ChevronRight, ChevronLeft, Heart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getAllAuthors } from '../../services/api';

export default function Authors() {
  const { isDark } = useContext(ThemeContext);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 6;

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
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Todos',
    'Narrativa',
    'Poesía',
    'Crítica',
    'Ensayo',
    'Crónica',
    'Drama'
  ];

  const staticAuthors = [
    {
      id: 1,
      name: 'Gabriel Mendoza',
      role: 'Novelista & Ensayista',
      category: 'Narrativa',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=350&fit=crop',
      description: 'Explorador de las narrativas caribeñas y la herencia cultural de Valledupar. Autor del libro "Ecos del Outsipador".',
      publications: 12,
      followers: 450,
      tags: ['Narrativa', 'Historia']
    },
    {
      id: 2,
      name: 'Elena Solano',
      role: 'Poeta & Editora',
      category: 'Poesía',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=350&fit=crop',
      description: 'Sus versos capturan la esencia del realismo mágico inspirado en la Revista Poliversia. Especialista en prosa poética.',
      publications: 28,
      followers: 1200,
      tags: ['Poesía', 'Edición']
    },
    {
      id: 3,
      name: 'Dr. Arturo Vives',
      role: 'Crítico Literario',
      category: 'Crítica',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=350&fit=crop',
      description: 'Especialista en literatura latinoamericana contemporánea con más de 20 años de trayectoria académica.',
      publications: 45,
      followers: 890,
      tags: ['Crítica', 'Ensayo']
    },
    {
      id: 4,
      name: 'Laura Martínez',
      role: 'Novelista',
      category: 'Narrativa',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=350&fit=crop',
      description: 'Autora de historias que entrelazan identidad, diáspora y tradición. Ganadora de premios literarios regionales.',
      publications: 19,
      followers: 650,
      tags: ['Narrativa', 'Identidad']
    },
    {
      id: 5,
      name: 'Carlos Ruiz',
      role: 'Ensayista & Moderador',
      category: 'Ensayo',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=350&fit=crop',
      description: 'Experto en debates literarios y análisis crítico de la cultura vallecaucana. Moderador de grupos focales.',
      publications: 35,
      followers: 920,
      tags: ['Ensayo', 'Debate']
    },
    {
      id: 6,
      name: 'Piedad Bonnett',
      role: 'Poeta & Memorialista',
      category: 'Poesía',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=350&fit=crop',
      description: 'Sus versos son testimonios de la complejidad humana. Autora de memorias poéticas que tocan el alma.',
      publications: 22,
      followers: 1100,
      tags: ['Poesía', 'Memoria']
    },
    {
      id: 7,
      name: 'Manuel González',
      role: 'Cronista',
      category: 'Crónica',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=350&fit=crop',
      description: 'Cronista de la vida cotidiana en Valledupar. Sus textos capturan historias que merecen ser contadas.',
      publications: 56,
      followers: 780,
      tags: ['Crónica', 'Periodismo']
    },
    {
      id: 8,
      name: 'Sofía Reyes',
      role: 'Autora Infantil',
      category: 'Infantil',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=350&fit=crop',
      description: 'Crea historias mágicas para niños que despiertan la imaginación y celebran la diversidad cultural.',
      publications: 14,
      followers: 520,
      tags: ['Infantil', 'Fantasía']
    }
  ];

  // Filtrar autores
  const displayAuthors = authors.length > 0 ? authors : staticAuthors;
  const uniqueGenres = [...new Set(displayAuthors.map(a => a.category))];
  const allCategories = ['Todos', ...uniqueGenres];

  const filteredAuthors = displayAuthors.filter(author => {
    const matchesCategory = selectedCategory === 'Todos' || author.category === selectedCategory;
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         author.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Paginación
  const totalPages = Math.ceil(filteredAuthors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuthors = filteredAuthors.slice(startIndex, startIndex + itemsPerPage);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      {/* Skip Link */}
      <a href="#authors-list" className="skip-link">
        Saltar a lista de autores
      </a>

      {/* Hero Section */}
      <section className={`px-4 sm:px-8 py-16 sm:py-20 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <p className={`text-sm font-semibold tracking-widest uppercase mb-4 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Comunidad Literaria
              </p>
              <h1 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Nuestros Autores &
                <br />
                <span className="italic font-playfair">Colaboradores</span>
              </h1>
              <p className={`text-lg mb-8 leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Conoce a las mentes brillantes que dan vida a Liberapalabras. Desde novelistas consagrados hasta poetas emergentes, exploramos la diversidad literaria de nuestra región.
              </p>

              <div className="flex gap-4 flex-wrap">
                <button className="bg-[#5D4037] hover:bg-[#4A302A] text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  👤 Unirse como Colaborador
                </button>
                <button className={`px-8 py-3 rounded-lg font-semibold transition-colors border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                  Conoce al Proceso
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className={`rounded-2xl overflow-hidden h-96 shadow-2xl transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&h=500&fit=crop"
                  alt="Biblioteca con autores leyendo sus obras"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge */}
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-gray-900 rounded-full p-6 font-bold text-center shadow-lg w-24 h-24 flex items-center justify-center">
                <span className="text-sm">+100 OBRAS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={`flex-1 px-4 sm:px-8 py-16 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Category Filter */}
          <div className="mb-10">
            <nav
              className="flex gap-2 overflow-x-auto pb-4"
              role="tablist"
              aria-label="Filtrar autores por categoría"
            >
              {allCategories.map(category => (
                <button
                  key={category}
                  role="tab"
                  aria-selected={selectedCategory === category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    selectedCategory === category
                      ? isDark
                        ? 'bg-[#5D4037] text-white'
                        : 'bg-[#5D4037] text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="mb-12 flex flex-col sm:flex-row gap-4">
            <div className={`flex-1 relative transition-colors ${isDark ? 'bg-gray-900 border border-gray-800 rounded-lg' : 'bg-gray-100 rounded-lg'}`}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Busca por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-12 pr-4 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'bg-gray-900 text-gray-100 placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-600'}`}
                aria-label="Buscar autores"
              />
            </div>

            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-label="Abrir opciones de filtro"
            >
              🔽 Filtros
            </button>
          </div>

          {/* Authors Grid */}
          <div
            id="authors-list"
            className="mb-12"
            role="list"
            aria-label="Lista de autores"
          >
            <h2 className={`text-3xl font-bold mb-8 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Directorio de Perfiles
            </h2>

            {loading ? (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-lg transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cargando autores...
                </p>
              </div>
            ) : paginatedAuthors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedAuthors.map(author => (
                  <article
                    key={author.id}
                    className={`rounded-2xl overflow-hidden transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-yellow-400 cursor-pointer group ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
                    role="listitem"
                    aria-label={`${author.name}, ${author.role}`}
                  >
                    {/* Image Container */}
                    <div className="relative overflow-hidden h-56">
                      <img
                        src={author.image}
                        alt={`Foto de perfil de ${author.name}, ${author.role}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isDark ? 'bg-yellow-400 text-gray-900' : 'bg-yellow-400 text-gray-900'}`}>
                          {author.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className={`text-xl font-bold mb-1 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {author.name}
                      </h3>
                      <p className={`text-sm font-semibold mb-4 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        {author.role}
                      </p>

                      <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {author.description}
                      </p>

                      {/* Stats */}
                      <div className="flex gap-6 mb-6 pb-6 border-b" role="group" aria-label="Estadísticas">
                        <div className="text-center flex-1">
                          <p className={`text-lg font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {author.publications || 0}
                          </p>
                          <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            Publicaciones
                          </p>
                        </div>
                        <div className="w-px bg-gray-300"></div>
                        <div className="text-center flex-1">
                          <p className={`text-lg font-bold flex items-center justify-center gap-1 transition-colors ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            <Heart size={16} />
                            {author.totalLikes || author.followers || 0}
                          </p>
                          <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {author.totalLikes !== undefined ? 'Me gusta' : 'Seguidores'}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex gap-2 mb-6 flex-wrap">
                        {author.tags.map(tag => (
                          <span
                            key={tag}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          aria-label={`Guardar perfil de ${author.name}`}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'border border-gray-700 text-gray-300 hover:bg-gray-800' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        >
                          <Bookmark size={18} />
                          <span className="hidden sm:inline text-sm font-semibold">Guardar</span>
                        </button>
                        <button
                          aria-label={`Contactar a ${author.name}`}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${isDark ? 'bg-[#5D4037] text-white hover:bg-[#4A302A]' : 'bg-[#5D4037] text-white hover:bg-[#4A302A]'}`}
                        >
                          <MessageCircle size={18} />
                          <span className="hidden sm:inline text-sm font-semibold">Contactar</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-lg transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No hay autores que coincidan con tu búsqueda.
                </p>
              </div>
            )}
            ) : (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-lg transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No hay autores disponibles.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={20} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
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
                  className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <section
            className={`text-center py-16 px-8 rounded-2xl transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}
            aria-labelledby="cta-heading"
          >
            <div className="text-4xl mb-4">📖</div>
            <h2
              id="cta-heading"
              className={`text-3xl font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
            >
              ¿Quieres compartir tu obra con nuestra comunidad?
            </h2>
            <p className={`text-lg mb-8 max-w-2xl mx-auto transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Buscamos constantemente voces frescas y perspectivas únicas de la región del César y el Caribe colombiano. Únete a nuestro panel de colaboradores.
            </p>
            <button
              className="bg-[#5D4037] hover:bg-[#4A302A] text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
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

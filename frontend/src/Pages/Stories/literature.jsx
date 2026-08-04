import React, { useState, useContext, useEffect } from 'react';
import { Search, Sliders, Grid, List, Bookmark, X, ShoppingCart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getPromotionalBooks } from '../../services/api';

export default function Literature() {
  const { isDark } = useContext(ThemeContext);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotionalBooks, setPromotionalBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    loadPromotionalBooks();
  }, []);

  const loadPromotionalBooks = async () => {
    try {
      setLoading(true);
      const response = await getPromotionalBooks();
      if (response.ok && response.books) {
        setPromotionalBooks(response.books);
      }
    } catch (error) {
      console.error('Error cargando libros promocionados:', error);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: 1,
      title: 'Revista Poliversia',
      description: 'Nuestra publicación insignia donde la voz de nuestros autores océano vive, ensayos, crítica y análisis que expanden la literatura.',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop',
      category: 'Publicación Periódica',
      link: 'Explorar sección'
    },
    {
      id: 2,
      title: 'Colección de Libros',
      description: 'Un catálogo curático de obras maestras y nuevos voces. Desde la prensa clásica hasta la contemporánea con acceso digital.',
      image: 'https://images.unsplash.com/photo-1507842747716-6fed3c493e2a?w=400&h=300&fit=crop',
      category: 'Biblioteca Digital',
      link: 'Explorar sección'
    },
    {
      id: 3,
      title: 'Grupo Focal Literario',
      description: 'El espacio de nuestra comunidad. Espacios de debate, talleres de escritura y encuentros presenciales y virtuales.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      category: 'Comunidad',
      link: 'Explorar sección'
    }
  ];

  const features = [
    { id: 1, icon: '📘', title: 'Reseñas & Contenido', description: 'Análisis y críticas actualizadas semanalmente por nuestro comité editorial y colaboradores.' },
    { id: 2, icon: '✦', title: 'Nuevas Voces', description: 'Espacio de difusión y mecenazgo para autores independientes y promesas de la literatura.' },
    { id: 3, icon: '🎭', title: 'Agenda Cultural', description: 'Recitales poéticos, lanzamientos de libros y talleres interactivos durante todo el año.' },
    { id: 4, icon: '💭', title: 'Foros de Crítica', description: 'Espacio abierto para la retroalimentación entre autores, lectores y académicos.' }
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative w-full py-16 sm:py-24 lg:py-32 flex items-center justify-start"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%), url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045359/69478894-7be6-4384-be37-40fc593636eb_xuegr6.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className={`max-w-xl p-8 sm:p-12 rounded-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`inline-block px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 transition-colors ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-[#5D4037]'}`}>
              Exploración Cultural
            </div>

            <h1 className={`text-4xl sm:text-5xl font-bold mb-6 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
              Nuestra <span className="italic font-serif">Literatura</span>
            </h1>

            <p className={`text-base mb-8 leading-relaxed transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Un viaje a través de las letras que definen nuestro territorio. Descubre publicaciones, archivos históricos y comunidades que mantienen viva la llama de la palabra escrita.
            </p>

            <div className="flex gap-4 flex-wrap items-center">
              <button className="px-6 py-3 rounded-lg font-semibold transition-colors text-white" style={{ backgroundColor: '#5D4037' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'} onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}>
                Explorar Sección
              </button>
              <button className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
                ✨ Suscripción gratuita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Libros en Venta Section */}
      {promotionalBooks.length > 0 && (
        <section className={`py-16 sm:py-24 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="mb-12 text-center">
              <h2 className={`text-3xl sm:text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                ✨ Libros en Venta
              </h2>
              <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Ediciones especiales con promociones exclusivas
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cargando libros...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {promotionalBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className={`group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                      isDark ? 'bg-gray-800 hover:shadow-xl hover:shadow-gray-900' : 'bg-white hover:shadow-lg'
                    } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    {/* Portada */}
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-amber-200 to-orange-200">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="text-4xl mb-2">📖</span>
                          <span className={`text-sm font-semibold line-clamp-2 ${isDark ? 'text-gray-900' : 'text-gray-700'}`}>
                            {book.title}
                          </span>
                        </div>
                      )}

                      {/* Descuento Badge */}
                      {book.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{book.discount}%
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-semibold">Ver detalles</span>
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                      <h3 className={`font-semibold text-sm mb-1 line-clamp-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {book.title}
                      </h3>

                      <p className={`text-xs mb-3 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        por {book.author}
                      </p>

                      {/* Precio */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className={`text-xl font-bold transition-colors ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          ${book.price.toFixed(2)}
                        </span>
                        {book.originalPrice && (
                          <span className={`text-sm line-through transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            ${book.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Disponibilidad */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          book.availability === 'available'
                            ? isDark
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-green-100 text-green-800'
                            : isDark
                            ? 'bg-yellow-900/50 text-yellow-300'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {book.availability === 'available' ? '✓ Disponible' : 'Limitado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Content Sections */}
      <section className={`py-16 sm:py-24 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg group cursor-pointer ${
                  isDark ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <div className="p-6">
                  <span className={`text-xs font-semibold tracking-widest uppercase mb-3 block transition-colors ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {section.category}
                  </span>

                  <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {section.title}
                  </h3>

                  <p className={`text-sm mb-6 leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {section.description}
                  </p>

                  <button className={`text-sm font-semibold transition-colors ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
                    {section.link} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 sm:py-24 transition-colors ${isDark ? 'bg-gray-900' : 'bg-amber-50/40'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h2 className={`text-4xl font-serif font-bold text-center mb-16 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Pilares de Nuestra Editorial
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`p-8 rounded-xl text-center transition-all duration-300 border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-amber-600 hover:shadow-lg hover:shadow-amber-900/20'
                    : 'bg-white border-gray-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/30'
                }`}
              >
                {/* Icon Circle */}
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-2xl transition-all border-2 ${
                  isDark
                    ? 'border-gray-600 text-amber-300'
                    : 'border-gray-300 text-amber-700'
                }`}>
                  {feature.icon}
                </div>

                <h3 className={`text-lg font-serif font-semibold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>

                <p className={`text-sm leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de Detalles */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Header del Modal */}
            <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h2 className={`text-2xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Detalles del Libro
              </h2>
              <button
                onClick={() => setSelectedBook(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Portada */}
                <div>
                  {selectedBook.coverImage ? (
                    <img
                      src={selectedBook.coverImage}
                      alt={selectedBook.title}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg flex items-center justify-center">
                      <span className="text-6xl">📖</span>
                    </div>
                  )}
                </div>

                {/* Info Básica */}
                <div>
                  <h3 className={`text-3xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {selectedBook.title}
                  </h3>

                  <p className={`text-lg mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    por <span className="font-semibold">{selectedBook.author}</span>
                  </p>

                  {/* Precios */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className={`text-4xl font-bold transition-colors ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        ${selectedBook.price.toFixed(2)}
                      </span>
                      {selectedBook.originalPrice && (
                        <span className={`text-lg line-through transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          ${selectedBook.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {selectedBook.discount > 0 && (
                      <p className="text-green-600 font-semibold">
                        ¡Ahorra {selectedBook.discount}% en esta compra!
                      </p>
                    )}
                  </div>

                  {/* Disponibilidad */}
                  <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Disponibilidad
                    </p>
                    <p className={`text-lg font-bold transition-colors ${
                      selectedBook.availability === 'available'
                        ? isDark
                          ? 'text-green-400'
                          : 'text-green-600'
                        : isDark
                        ? 'text-yellow-400'
                        : 'text-yellow-600'
                    }`}>
                      {selectedBook.availability === 'available' ? '✓ Disponible' : '⏱ Disponibilidad Limitada'}
                    </p>
                  </div>

                  {/* Botón Comprar */}
                  <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    Comprar Ahora
                  </button>
                </div>
              </div>

              {/* Sinopsis */}
              {selectedBook.synopsis && (
                <div className="mb-8">
                  <h4 className={`text-lg font-semibold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Sinopsis
                  </h4>
                  <p className={`leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedBook.synopsis}
                  </p>
                </div>
              )}

              {/* Información Editorial */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                {selectedBook.isbn && (
                  <div>
                    <p className={`text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      ISBN
                    </p>
                    <p className={`font-mono text-sm transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {selectedBook.isbn}
                    </p>
                  </div>
                )}

                {selectedBook.publisher && (
                  <div>
                    <p className={`text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Editorial
                    </p>
                    <p className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {selectedBook.publisher}
                    </p>
                  </div>
                )}

                {selectedBook.pages && (
                  <div>
                    <p className={`text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Páginas
                    </p>
                    <p className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {selectedBook.pages}
                    </p>
                  </div>
                )}

                {selectedBook.language && (
                  <div>
                    <p className={`text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Idioma
                    </p>
                    <p className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {selectedBook.language}
                    </p>
                  </div>
                )}

                {selectedBook.publicationDate && (
                  <div>
                    <p className={`text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Publicación
                    </p>
                    <p className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(selectedBook.publicationDate).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                )}

                <div>
                  <p className={`text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Género
                  </p>
                  <p className={`capitalize transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {selectedBook.genre}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {selectedBook.tags && selectedBook.tags.length > 0 && (
                <div className="mt-6">
                  <p className={`text-sm font-semibold mb-3 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Etiquetas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBook.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-amber-900/50 text-amber-300'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

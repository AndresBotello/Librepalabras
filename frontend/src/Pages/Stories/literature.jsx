import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarDays, Feather, MessagesSquare, X, ShoppingCart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { getPromotionalBooks } from '../../services/api';
import genresData from '../../config/genres.json';
import { GenreIcon } from '../../config/genreIcons';
import { FOCUS_GROUP_NAME } from '../../config/focusGroup';
import focusGroupLogo from '../../assets/grupo-focal-alfredo-correa.jpeg';


const HERO_OVERLAY = [
  'linear-gradient(to bottom,',
  'color-mix(in srgb, var(--color-gray-950) 75%, transparent) 0%,',
  'color-mix(in srgb, var(--color-gray-950) 80%, transparent) 50%,',
  'color-mix(in srgb, var(--color-gray-950) 95%, transparent) 100%)',
].join(' ');

const BOOK_SALES_EMAIL = 'librepalabras@gmail.com';


// negocio: el correo de ventas es una cuenta de Gmail y se quiere que el
// botón abra directamente el compositor web con todo pre-rellenado.
function buildBookPurchaseGmailUrl(book) {
  const subject = `Compra de libro: ${book.title}`;
  const referenceUrl = `${window.location.origin}${window.location.pathname}?libro=${book.id}`;
  const body = [
    `Título: ${book.title}`,
    `Autor: ${book.author}`,
    `Precio: $${book.price.toFixed(2)}`,
    ...(book.isbn ? [`ISBN: ${book.isbn}`] : []),
    '',
    'Estoy interesado en comprar este libro publicado en Liberapalabras.com',
    '',
    `Referencia: ${referenceUrl}`,
  ].join('\n');

  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: BOOK_SALES_EMAIL,
    su: subject,
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

export default function Literature() {
  const { isDark } = useContext(ThemeContext);
  const [promotionalBooks, setPromotionalBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);

  /**
   * La categoría llega en la URL (?genero=novela) desde el menú "Libros" de la
   * barra superior. El filtrado se hace aquí y no en el servidor porque el
   * catálogo ya viene entero: pedirlo otra vez por cada categoría sería una
   * consulta de más para reordenar lo que ya está en memoria.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const genreParam = searchParams.get('genero');
  const selectedGenre = genresData.genres.some((g) => g.value === genreParam) ? genreParam : 'all';

  const setSelectedGenre = useCallback((value) => {
    setSearchParams(value && value !== 'all' ? { genero: value } : {}, { replace: true });
  }, [setSearchParams]);

  const genreLabel = genresData.genres.find((g) => g.value === selectedGenre)?.label || selectedGenre;

  const visibleBooks = useMemo(() => (
    selectedGenre === 'all'
      ? promotionalBooks
      : promotionalBooks.filter((book) => book.genre === selectedGenre)
  ), [promotionalBooks, selectedGenre]);

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

  // Cada tarjeta lleva a su sección real. Antes eran `<button>` sin destino:
  // se veían pulsables y no hacían nada.
  const sections = [
    {
      id: 1,
      title: 'Revista Poleversia',
      description: 'Nuestra publicación periódica: ensayo, crítica y análisis. Cada edición se lee completa aquí mismo.',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop',
      category: 'Publicación Periódica',
      to: '/poleversia',
      link: 'Leer las ediciones',
    },
    {
      id: 2,
      title: 'Nuestros Autores',
      description: 'Las voces que sostienen el catálogo: escritores de Valledupar, el Cesar y el Caribe colombiano.',
      // La imagen anterior devolvía 404 y la tarjeta salía en blanco.
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop',
      category: 'Quiénes escriben',
      to: '/authors',
      link: 'Conocer a los autores',
    },
    {
      id: 3,
      title: FOCUS_GROUP_NAME,
      description: 'Cátedras por videollamada y tertulias abiertas al comentario. El espacio de debate de la comunidad.',
      image: focusGroupLogo,
      category: 'Comunidad',
      to: '/grupo-focal',
      link: 'Entrar al grupo focal',
    },
  ];

  // Iconos de línea en lugar de emojis, como en el resto del sitio.
  const features = [
    { id: 1, icon: BookOpen, title: 'Reseñas & Contenido', description: 'Análisis y críticas actualizadas semanalmente por nuestro comité editorial y colaboradores.' },
    { id: 2, icon: Feather, title: 'Nuevas Voces', description: 'Espacio de difusión y mecenazgo para autores independientes y promesas de la literatura.' },
    { id: 3, icon: CalendarDays, title: 'Agenda Cultural', description: 'Recitales poéticos, lanzamientos de libros y talleres interactivos durante todo el año.' },
    { id: 4, icon: MessagesSquare, title: 'Foros de Crítica', description: 'Espacio abierto para la retroalimentación entre autores, lectores y académicos.' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative w-full py-16 sm:py-24 lg:py-32 flex items-center justify-start"
        style={{
          backgroundImage: `${HERO_OVERLAY}, url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045359/69478894-7be6-4384-be37-40fc593636eb_xuegr6.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className={`max-w-xl p-8 sm:p-12 rounded-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`inline-block px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 transition-colors ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-brand-700'}`}>
              Exploración Cultural
            </div>

            <h1 className={`text-4xl sm:text-5xl font-bold mb-6 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-brand-700'}`}>
              Nuestros <span className="italic font-serif">Libros</span>
            </h1>

            <p className={`text-base mb-8 leading-relaxed transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Un viaje a través de las letras que definen nuestro territorio. Descubre publicaciones, archivos históricos y comunidades que mantienen viva la llama de la palabra escrita.
            </p>

            {/* Los dos botones de antes no llevaban a ninguna parte. Ahora uno
                baja al catálogo y el otro va a la biblioteca de obras; el de
                "suscripción gratuita" se retiró porque prometía algo que el
                sitio no ofrece. */}
            <div className="flex gap-4 flex-wrap items-center">
              <a
                href="#catalogo"
                className="px-6 py-3 rounded-lg font-semibold transition-colors text-white"
                style={{ backgroundColor: 'var(--color-brand-700)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-800)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-700)'}
              >
                Ver el catálogo
              </a>
              <Link
                to="/stories"
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Leer obras gratis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Libros en Venta. La sección también se pinta cuando hay una categoría
          activa aunque no haya libros: al menú de la barra superior se puede
          llegar a una categoría vacía, y sin esto la página no mostraría nada,
          como si estuviera rota. */}
      {(promotionalBooks.length > 0 || selectedGenre !== 'all') && (
        <section id="catalogo" className={`py-16 sm:py-24 transition-colors ${isDark ? 'bg-gray-900' : 'bg-stone-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="mb-12 text-center">
              <span className={`text-xs font-bold tracking-[0.2em] uppercase ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                Catálogo
              </span>
              <h2 className={`text-3xl sm:text-4xl font-serif font-bold mt-3 mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-stone-900'}`}>
                Libros de la casa
              </h2>
              <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                Ediciones de nuestros autores. Pulsa una portada para ver la ficha completa.
              </p>

              {selectedGenre !== 'all' && (
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                    isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-gray-900 text-gray-50'
                  }`}>
                    <GenreIcon genre={selectedGenre} />
                    {genreLabel}
                    <span className="text-[11px] tabular-nums opacity-70">{visibleBooks.length}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedGenre('all')}
                    className={`text-sm font-semibold transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Quitar filtro
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cargando libros...
                </p>
              </div>
            ) : visibleBooks.length === 0 ? (
              <div className={`py-16 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-lg mb-2">Todavía no hay libros en {genreLabel}.</p>
                <button
                  type="button"
                  onClick={() => setSelectedGenre('all')}
                  className={`text-sm font-semibold underline transition-colors ${
                    isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:text-brand-800'
                  }`}
                >
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              /**
               * Estantería, no escaparate: lo que manda es la portada, en
               * proporción de libro real y con el lomo sombreado. La ficha
               * comercial (precio, descuento, disponibilidad) va debajo y en
               * tamaño pequeño, para que el catálogo se lea como una biblioteca
               * y no como una tienda de productos.
               */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
                {visibleBooks.map((book) => (
                  <article key={book.id} className="group">
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-md"
                      aria-label={`Ver detalles de ${book.title}`}
                    >
                      <div className={`relative aspect-[2/3] rounded-sm rounded-r-md overflow-hidden transition-all duration-300 group-hover:-translate-y-2 ${
                        isDark
                          ? 'shadow-lg shadow-black/50 group-hover:shadow-2xl group-hover:shadow-black/70'
                          : 'shadow-lg shadow-stone-900/25 group-hover:shadow-2xl group-hover:shadow-stone-900/35'
                      }`}>
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={`Portada de ${book.title}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          /* Sin portada se compone una: papel, filete y título
                             centrado. Mejor que un emoji sobre un degradado. */
                          <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center border ${
                            isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'
                          }`}>
                            <span className={`w-8 border-t mb-3 ${isDark ? 'border-amber-500/60' : 'border-amber-600/60'}`} />
                            <span className={`font-serif text-sm leading-snug line-clamp-4 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                              {book.title}
                            </span>
                            <span className={`w-8 border-t mt-3 ${isDark ? 'border-amber-500/60' : 'border-amber-600/60'}`} />
                          </div>
                        )}

                        {/* Lomo: la sombra del canto izquierdo es lo que hace
                            que una imagen plana se lea como un libro. */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none"
                        />
                      </div>

                      <div className="mt-4">
                        <h3 className={`font-serif font-bold text-[15px] leading-snug line-clamp-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                          {book.title}
                        </h3>

                        <p className={`text-xs italic mt-1 line-clamp-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          {book.author}
                        </p>

                        <div className={`flex items-baseline gap-2 mt-2.5 text-sm ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                          <span className="font-semibold tabular-nums">
                            ${book.price.toFixed(2)}
                          </span>
                          {book.originalPrice && (
                            <span className={`text-xs line-through tabular-nums ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                              ${book.originalPrice.toFixed(2)}
                            </span>
                          )}
                          {book.discount > 0 && (
                            <span className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              −{book.discount}%
                            </span>
                          )}
                        </div>

                        <p className={`flex items-center gap-1.5 mt-1.5 text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                          {/* `amber` está redefinido a verde en la paleta del
                              sitio, así que para "limitado" hace falta un color
                              que no lo esté; si no, los dos estados se ven
                              iguales. */}
                          <span
                            aria-hidden="true"
                            className={`w-1.5 h-1.5 rounded-full ${
                              book.availability === 'available' ? 'bg-emerald-500' : 'bg-orange-500'
                            }`}
                          />
                          {book.availability === 'available' ? 'Disponible' : 'Edición limitada'}
                        </p>
                      </div>
                    </button>
                  </article>
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
              <Link
                key={section.id}
                to={section.to}
                className={`flex flex-col rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg group ${
                  isDark ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={section.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <span className={`text-xs font-semibold tracking-widest uppercase mb-3 block transition-colors ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {section.category}
                  </span>

                  <h3 className={`text-xl font-serif font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {section.title}
                  </h3>

                  <p className={`text-sm mb-6 leading-relaxed flex-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {section.description}
                  </p>

                  <span className={`text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {section.link} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
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
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-all border-2 ${
                  isDark
                    ? 'border-gray-600 text-amber-300'
                    : 'border-gray-300 text-amber-700'
                }`}>
                  <feature.icon className="w-6 h-6" strokeWidth={1.5} />
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
                    <div className="w-full h-96 bg-gradient-to-br from-amber-200 to-brand-200 rounded-lg flex items-center justify-center">
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
                  {/* Un paso más oscuro que el resto del acento: el turquesa
                      medio con texto blanco se queda en 3,7:1 y no llega a AA. */}
                  <a
                    href={buildBookPurchaseGmailUrl(selectedBook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Comprar Ahora
                  </a>
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

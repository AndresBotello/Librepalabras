import React, { useState, useContext, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  Send,
  Library,
  Feather,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import SocialIcon from '../../components/SocialIcon';
import AuthorDetailModal from '../../components/AuthorDetailModal';
import { platformLabel } from '../../utils/socialLinks';
import { getAllAuthors } from '../../services/api';

/**
 * Catálogo de autores.
 *
 * Usa la paleta del sitio (azul de marca sobre neutros de piedra) en vez del
 * sepia que tenía antes: aquel marrón no salía de ningún token, y como en este
 * proyecto `amber` está redefinido a verde, los degradados "ámbar" acababan
 * pintándose verdes y desentonando con el resto de páginas.
 */
export default function Authors() {
  const { isDark } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  /**
   * El autor con la ficha abierta vive en la URL (?autor=id), no en el estado:
   * así el buscador de la portada puede enlazar a una ficha concreta, el enlace
   * se puede compartir y el botón "atrás" cierra la ficha en vez de sacarte de
   * la página. La lista ya viene entera, así que abrirla no pide nada al
   * servidor: basta con encontrar al autor.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const authorParam = searchParams.get('autor');
  const selectedAuthor = authors.find((author) => author.id === authorParam) || null;

  const openAuthor = (id) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('autor', id);
      return next;
    });
  };

  const closeAuthor = () => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('autor');
      return next;
    });
  };

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
      (author.description && author.description.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredAuthors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuthors = filteredAuthors.slice(startIndex, startIndex + itemsPerPage);

  const surface = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const mutedText = isDark ? 'text-stone-400' : 'text-stone-600';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 font-sans ${
      isDark ? 'bg-stone-950 text-stone-200' : 'bg-stone-50 text-stone-800'
    }`}>
      <Navbar />

      {/* Portada */}
      <section className={`relative overflow-hidden pt-12 pb-16 px-4 sm:px-8 border-b ${
        isDark ? 'border-stone-800' : 'border-stone-200'
      }`}>
        {/* Halos muy tenues, del azul de marca y del verde de acento. */}
        <div aria-hidden="true" className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
        <div aria-hidden="true" className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-7">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 border ${
                isDark
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-amber-500/10 text-amber-700 border-amber-600/20'
              }`}>
                <Library size={14} />
                Galería de creadores
              </span>

              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6 leading-[1.15] ${
                isDark ? 'text-stone-100' : 'text-stone-900'
              }`}>
                La biblioteca de <br />
                <span className={isDark ? 'italic text-amber-400' : 'italic text-brand-700'}>
                  nuestras voces
                </span>
              </h1>

              <p className={`text-base sm:text-lg mb-8 max-w-2xl leading-relaxed ${mutedText}`}>
                Explora el catálogo de plumas, ensayistas y poetas que componen nuestro acervo
                cultural. Un recorrido por la identidad y la palabra viva de la región.
              </p>

              {/* Antes eran dos botones sin destino. Este lleva al registro, que
                  es la vía real para sumarse; el segundo ("Conocer criterios
                  editoriales") se retiró porque no existe esa página. */}
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors shadow-lg shadow-brand-950/20"
              >
                <Feather size={16} />
                Unirse como colaborador
              </Link>
            </div>

            {/* Retrato enmarcado. El sello flotante anunciaba "+100 Obras y
                Autores", un número inventado; ahora muestra los autores que hay
                de verdad en el catálogo. */}
            <div className="lg:col-span-5 relative">
              <div className={`relative rounded-2xl overflow-hidden h-80 sm:h-96 shadow-2xl border p-2 ${
                isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'
              }`}>
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&fit=crop"
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {!loading && authors.length > 0 && (
                <div className={`absolute -bottom-6 -left-4 sm:-left-6 rounded-2xl p-4 shadow-xl border flex items-center gap-3.5 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-brand-700)' }}>
                    <Library size={20} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${mutedText}`}>
                      En el catálogo
                    </p>
                    <p className={`text-sm font-serif font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {authors.length} {authors.length === 1 ? 'autor registrado' : 'autores registrados'}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <main className="flex-1 px-4 sm:px-8 py-12">
        <div className="max-w-7xl mx-auto">

          {/* Buscador. El botón "Fichero de Filtros" que había al lado no
              abría nada, así que se retiró en vez de dejarlo decorativo. */}
          <div className="mb-12">
            <div className="relative w-full sm:max-w-md">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${mutedText}`} />
              <input
                type="text"
                placeholder="Buscar autor por nombre o semblanza…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-11 pr-10 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 shadow-sm'
                }`}
                aria-label="Buscar autores"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${mutedText} hover:opacity-70`}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div id="authors-list" className="mb-12" role="list" aria-label="Lista de autores">
            <div className={`flex items-center justify-between mb-8 pb-3 border-b ${
              isDark ? 'border-stone-800' : 'border-stone-200'
            }`}>
              <h2 className={`text-2xl font-bold font-serif tracking-tight flex items-center gap-2.5 ${
                isDark ? 'text-stone-100' : 'text-stone-900'
              }`}>
                <BookOpen size={22} style={{ color: 'var(--color-brand-700)' }} />
                Índice de autores
              </h2>
              <span className={`text-xs uppercase tracking-widest ${mutedText}`}>
                {filteredAuthors.length} {filteredAuthors.length === 1 ? 'perfil' : 'perfiles'}
              </span>
            </div>

            {loading ? (
              <div className={`text-center py-24 rounded-2xl border border-dashed ${
                isDark ? 'border-stone-800' : 'border-stone-300'
              }`}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mb-4" style={{ borderColor: 'var(--color-brand-700)', borderTopColor: 'transparent' }} />
                <p className={`text-sm italic ${mutedText}`}>
                  Consultando el catálogo de autores…
                </p>
              </div>
            ) : paginatedAuthors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                {paginatedAuthors.map(author => (
                  <article
                    key={author.id}
                    className={`group relative rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden ${surface} ${
                      isDark ? 'hover:border-stone-700 shadow-lg shadow-black/20' : 'hover:border-stone-300 shadow-sm hover:shadow-xl'
                    }`}
                    role="listitem"
                    aria-label={author.name}
                  >
                    {/* Filete superior: el toque de color de la tarjeta. */}
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-brand-600" />

                    <div>
                      <div className="pt-8 pb-4 flex flex-col items-center px-5">
                        <img
                          src={author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=300`}
                          alt={`Foto de perfil de ${author.name}`}
                          className={`w-24 h-24 rounded-full object-cover mb-4 ring-4 ${
                            isDark ? 'ring-stone-800' : 'ring-stone-100'
                          }`}
                        />

                        <h3 className={`text-lg font-serif font-bold text-center truncate w-full px-2 ${
                          isDark ? 'text-stone-100' : 'text-stone-900'
                        }`}>
                          {author.name}
                        </h3>

                        {author.role && (
                          <p className={`text-xs mt-1 font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                            {author.role}
                          </p>
                        )}
                      </div>

                      <div className="px-6 pb-4">
                        <p className={`text-xs leading-relaxed line-clamp-3 italic ${mutedText}`}>
                          {author.description || 'Sin semblanza registrada todavía.'}
                        </p>
                      </div>
                    </div>

                    <div className={`px-5 pb-5 pt-3 border-t ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
                      <div className="space-y-3">
                        {author.links?.length > 0 && (
                          <div className="flex items-center justify-center gap-2 pb-1">
                            {author.links.map(link => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={platformLabel(link.url, link.label)}
                                aria-label={`${platformLabel(link.url, link.label)} de ${author.name}`}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'text-stone-400 hover:text-amber-400 hover:bg-stone-800' : 'text-stone-500 hover:text-amber-700 hover:bg-stone-100'
                                }`}
                              >
                                <SocialIcon url={link.url} size={14} />
                              </a>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => openAuthor(author.id)}
                          aria-label={`Ver la ficha completa de ${author.name}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <BookOpen size={13} />
                          Ver ficha
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`text-center py-20 px-6 rounded-2xl border border-dashed ${
                isDark ? 'border-stone-800' : 'border-stone-300'
              }`}>
                {authors.length === 0 ? (
                  <>
                    <p className={`text-base font-serif font-bold mb-1 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                      El catálogo está vacío
                    </p>
                    <p className={`text-xs italic ${mutedText}`}>
                      Estamos organizando el catálogo de autores. Vuelve pronto.
                    </p>
                  </>
                ) : (
                  <p className={`text-sm italic ${mutedText}`}>
                    No se encontraron autores que coincidan con la búsqueda.
                  </p>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className={`p-2.5 rounded-xl transition-all border disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? 'border-stone-800 text-stone-300 hover:bg-stone-800' : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border ${
                      currentPage === page
                        ? 'bg-brand-700 text-white border-brand-700'
                        : isDark
                          ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className={`p-2.5 rounded-xl transition-all border disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? 'border-stone-800 text-stone-300 hover:bg-stone-800' : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Llamada a publicar */}
          <section
            className={`relative overflow-hidden text-center py-14 px-6 rounded-3xl border ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
            }`}
            aria-labelledby="cta-heading"
          >
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ backgroundColor: 'var(--color-brand-700)' }}>
                <Feather size={22} />
              </div>
              <h2
                id="cta-heading"
                className={`text-2xl sm:text-3xl font-bold font-serif mb-3 tracking-tight ${
                  isDark ? 'text-stone-100' : 'text-stone-900'
                }`}
              >
                ¿Deseas integrar tu obra en este catálogo?
              </h2>
              <p className={`text-sm mb-8 leading-relaxed ${mutedText}`}>
                Recibimos manuscritos, ensayos y poesía de voces emergentes y consolidadas del
                Caribe colombiano. Crea tu cuenta y publica tu obra para que la revise el comité
                editorial.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors shadow-lg shadow-brand-950/20"
              >
                <Send size={15} />
                Crear cuenta y publicar
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />

      {selectedAuthor && (
        <AuthorDetailModal
          author={selectedAuthor}
          onClose={closeAuthor}
        />
      )}
    </div>
  );
}

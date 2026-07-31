import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApprovedWorks } from '../../services/api';

export default function Home() {
  const { isDark } = useContext(ThemeContext);
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
              bio: `Creador de "${work.title}" y ${response.works.filter(w => w.authorId === work.authorId).length} obra(s) más.`,
              description: work.authorDescription || null,
              img: work.authorPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(work.author)}&background=random&size=300`
            };
          }
        });
        setAuthors(Object.values(uniqueAuthors).slice(0, 4));
      }
    } catch (err) {
      console.error('Error cargando autores:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* 1. Scrollbar personalizada para mayor usabilidad y estética */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? '#0c0a09' : '#FAF8F5'};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#44403c' : '#d6d3d1'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#78716c' : '#a8a29e'};
        }

        /* 2. Textura de ruido sutil (efecto papel editorial) */
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        }

        /* 3. Efecto 'Shimmer' (brillo al pasar el mouse) para las tarjetas */
        .shimmer-card {
          position: relative;
          overflow: hidden;
        }
        .shimmer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
          transform: skewX(-25deg);
          transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        .shimmer-card:hover::before {
          left: 150%;
        }

        /* 4. Animación de flotación suave para elementos de fondo */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        /* 5. Animación de gradiente en el texto principal */
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>

      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${
        isDark ? 'bg-[#0c0a09] text-stone-200' : 'bg-[#FAF8F5] text-stone-800'
      }`}>
        <Navbar />

        {/* ================= HERO SECTION ================= */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden py-16 px-4 sm:px-8">
          {/* Elementos de fondo con blur y animación de flotación */}
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none animate-float" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-yellow-700/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

          {/* Capa de textura de ruido para sensación táctil */}
          <div className="absolute inset-0 bg-noise pointer-events-none opacity-40 z-10" />

          {/* Imagen de fondo con overlay mejorado */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center scale-105 transition-transform duration-[2000ms] ease-out"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(12, 10, 9, 0.75), rgba(12, 10, 9, 0.95)), url('https://res.cloudinary.com/dtuyckctv/image/upload/v1785045359/69478894-7be6-4384-be37-40fc593636eb_xuegr6.webp')`,
            }}
          />

          {/* Contenido del Hero */}
          <div className="relative z-20 max-w-5xl mx-auto text-center px-4">
            <div className="inline-flex items-center gap-2 bg-stone-950/60 backdrop-blur-md border border-amber-500/30 text-amber-300 px-5 py-2 rounded-full text-xs sm:text-sm font-medium mb-8 shadow-2xl shadow-amber-900/20 hover:border-amber-400/50 transition-colors cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
              Ecosistema Literario del Cesar
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-stone-100 mb-8 leading-[1.1] tracking-tight">
              Donde las palabras <br className="hidden sm:block" />
              <span className="italic font-normal bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent animate-gradient">
                encuentran su libertad
              </span>
            </h1>

            <p className="text-stone-300 text-lg sm:text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
              Un portal para explorar la memoria, el ensayo y la narrativa viva de Valledupar y el Caribe colombiano.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <button className="group relative w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-amber-600/20 hover:shadow-amber-500/40 hover:-translate-y-1 overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Explorar Publicaciones
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </button>
              <button className="w-full sm:w-auto bg-stone-900/40 hover:bg-stone-800/60 text-stone-200 border border-stone-700/50 backdrop-blur-md px-10 py-4 rounded-xl font-medium transition-all duration-300 hover:-translate-y-1 hover:border-stone-600">
                Conocer Autores
              </button>
            </div>
          </div>
          
          {/* Indicador de scroll para guiar al usuario */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-60 animate-bounce">
            <span className="text-[10px] uppercase tracking-widest text-stone-400">Descubrir</span>
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </section>

        {/* ================= SECCIONES PRINCIPALES (BENTO) ================= */}
        <section className={`relative py-24 px-4 sm:px-8 transition-colors ${isDark ? 'bg-[#0c0a09]' : 'bg-[#FAF8F5]'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-stone-500/20 pb-8">
              <div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400">
                  Estructura Editorial
                </span>
                <h2 className={`text-4xl sm:text-5xl font-serif font-bold mt-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Nuestras Secciones
                </h2>
              </div>
              <p className={`text-base sm:text-lg max-w-md mt-6 md:mt-0 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Espacios curados para el pensamiento crítico, la creación poética y la conversación comunitaria.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Card Principal */}
              <div className={`lg:col-span-7 group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/10 shimmer-card ${
                isDark ? 'bg-stone-900/40 border-stone-800 hover:border-amber-500/40' : 'bg-white border-stone-200 hover:border-amber-600/40'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                  <div className="relative h-72 sm:h-auto overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1507842747716-6fed3c493e2a?w=800&fit=crop" alt="Revista Poliversia" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-stone-950/80 to-transparent sm:hidden" />
                  </div>
                  <div className="p-8 sm:p-10 flex flex-col justify-between relative z-10">
                    <div>
                      <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
                        Publicación Periódica
                      </span>
                      <h3 className={`text-3xl font-serif font-bold mb-4 leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                        Revista Poliversia
                      </h3>
                      <p className={`text-base leading-relaxed mb-8 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Un diálogo multidisciplinario entre la literatura, las artes plásticas y el pensamiento crítico territorial.
                      </p>
                    </div>
                    <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-4 transition-all duration-300">
                      Explorar Edición Actual <span className="text-lg">→</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Card Secundaria */}
              <div className={`lg:col-span-5 group relative overflow-hidden rounded-3xl border p-8 sm:p-10 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/10 shimmer-card ${
                isDark ? 'bg-stone-900/40 border-stone-800 hover:border-amber-500/40' : 'bg-white border-stone-200 hover:border-amber-600/40'
              }`}>
                <div>
                  <div className="relative h-56 overflow-hidden rounded-2xl mb-8">
                    <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&fit=crop" alt="Libros y Relatos" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                  <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
                    Colección Editorial
                  </span>
                  <h3 className={`text-2xl font-serif font-bold mb-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    Libros y Relatos
                  </h3>
                  <p className={`text-base leading-relaxed mb-8 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Nuestra biblioteca digital de obras completas, antologías inéditas y narrativa local.
                  </p>
                </div>
                <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-4 transition-all duration-300">
                  Ver Catálogo Completo <span className="text-lg">→</span>
                </a>
              </div>

              {/* Card Tercera (Ancho Completo) */}
              <div className={`lg:col-span-12 group relative overflow-hidden rounded-3xl border p-8 sm:p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/10 shimmer-card ${
                isDark ? 'bg-stone-900/40 border-stone-800 hover:border-amber-500/40' : 'bg-white border-stone-200 hover:border-amber-600/40'
              }`}>
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-full md:w-1/3 h-64 overflow-hidden rounded-2xl shrink-0 relative">
                    <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&fit=crop" alt="Grupo Focal" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 to-transparent md:hidden" />
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col justify-center">
                    <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20 w-fit">
                      Comunidad & Debate
                    </span>
                    <h3 className={`text-3xl font-serif font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      Grupo Focal
                    </h3>
                    <p className={`text-base leading-relaxed mb-8 max-w-2xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      Mesas de diálogo, laboratorios de escritura y encuentros presenciales donde la comunidad literaria intercambia ideas sobre la identidad caribe.
                    </p>
                    <div>
                      <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-4 transition-all duration-300">
                        Unirse a la conversación <span className="text-lg">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= AUTORES DESTACADOS ================= */}
        <section className={`relative py-24 px-4 sm:px-8 border-y transition-colors ${
          isDark ? 'bg-stone-950 border-stone-800/80' : 'bg-[#F4F0EA] border-stone-200'
        }`}>
          <div className="absolute inset-0 bg-noise pointer-events-none opacity-30" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400">
                Voces del Territorio
              </span>
              <h2 className={`text-4xl sm:text-5xl font-serif font-bold mt-3 mb-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Autores Destacados
              </h2>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Creadores, investigadores y pensadores que tejen la memoria literaria de nuestra región.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <p className={isDark ? 'text-stone-400' : 'text-stone-600'}>Cargando autores...</p>
                </div>
              ) : authors.length > 0 ? (
                authors.map((author, index) => (
                <div key={index} className={`group relative p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between shimmer-card ${
                  isDark ? 'bg-stone-900/30 border-stone-800/80 hover:bg-stone-900/80 hover:border-amber-500/30' : 'bg-white border-stone-200 hover:shadow-2xl hover:shadow-stone-300/50'
                }`}>
                  {/* Comilla decorativa de fondo */}
                  <div className={`absolute top-4 right-6 text-6xl font-serif leading-none select-none pointer-events-none opacity-20 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                    “
                  </div>

                  <div>
                    <div className="relative w-28 h-28 mx-auto mb-8">
                      <div className={`absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${isDark ? 'bg-amber-500/30' : 'bg-amber-400/40'}`} />
                      <img src={author.img} alt={author.name} className="relative w-full h-full object-cover rounded-full ring-2 ring-amber-500/30 group-hover:ring-amber-500 transition-all duration-500 grayscale group-hover:grayscale-0" />
                    </div>
                    <span className="block text-center text-[10px] font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400 mb-3">
                      {author.role}
                    </span>
                    <h3 className={`text-xl font-serif font-bold text-center mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {author.name}
                    </h3>
                    <p className={`text-sm text-center leading-relaxed italic ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      {author.bio}
                    </p>
                    {author.description && (
                      <p className={`text-sm text-center leading-relaxed mt-4 pt-4 border-t border-stone-500/20 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        {author.description}
                      </p>
                    )}
                  </div>
                  <div className="text-center pt-6 mt-6 border-t border-stone-500/10">
                    <a href="#" className="text-xs font-bold tracking-wider uppercase text-stone-400 hover:text-amber-500 transition-colors duration-300 flex items-center justify-center gap-1 group-hover:gap-2">
                      Ver Semblanza <span>→</span>
                    </a>
                  </div>
                </div>
              ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className={isDark ? 'text-stone-400' : 'text-stone-600'}>No hay autores disponibles aún.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= MANIFIESTO EDITORIAL ================= */}
        <section className={`relative py-24 px-4 sm:px-8 transition-colors ${isDark ? 'bg-[#0c0a09]' : 'bg-[#FAF8F5]'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950 p-10 sm:p-16 border border-amber-500/20 shadow-2xl text-stone-100 group">
              {/* Glow de fondo animado */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-amber-500/30 transition-colors duration-1000" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-700/10 rounded-full blur-[100px] pointer-events-none" />
              
              <span className="absolute -bottom-12 -right-12 text-[12rem] font-serif font-bold text-amber-500/5 select-none pointer-events-none leading-none">
                LIBERA
              </span>

              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-amber-400 mb-6">
                  <span className="w-8 h-[1px] bg-amber-400/50"></span>
                  Convocatoria Abierta
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-8 leading-[1.1] text-stone-100">
                  ¿Tienes una voz o historia <br className="hidden sm:block" />
                  <span className="text-amber-400 italic font-normal">que debe ser leída?</span>
                </h2>
                <p className="text-stone-300 text-lg sm:text-xl leading-relaxed mb-10 font-light max-w-2xl">
                  Buscamos constantemente nuevos ensayistas, poetas y narradores que deseen publicar en Liberapalabras y formar parte del archivo literario del Cesar.
                </p>

                <div className="flex flex-wrap gap-5">
                  <button className="group relative bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40 hover:-translate-y-1 overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Postular Texto
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </button>
                  <button className="border border-stone-700 hover:bg-stone-800/50 hover:border-stone-600 text-stone-200 font-medium px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-1">
                    Criterios Editoriales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
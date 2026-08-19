import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import EventAgenda from '../../components/EventAgenda';
import HomeEditorial from '../../components/HomeEditorial';
import HomeInvitationPopup from '../../components/HomeInvitationPopup';
import SiteSearch from '../../components/SiteSearch';
import { FOCUS_GROUP_TYPES, getAllAuthors, getFocusGroupSessions, getHomeContent } from '../../services/api';
import { FOCUS_GROUP_NAME, meetingState } from '../../config/focusGroup';
import focusGroupLogo from '../../assets/grupo-focal-alfredo-correa.jpeg';

// Imagen original del banner. Se usa mientras el admin no suba otra desde
// /admin/home, para que la portada nunca quede sin fondo.
const DEFAULT_HERO_IMAGE = 'https://res.cloudinary.com/j7q2huvz/image/upload/v1785971697/69478894-7be6-4384-be37-40fc593636eb_f9ibui.webp';


const HOME_CACHE_KEY = 'homeContent';
const CACHED_FIELDS = [
  'heroTitle',
  'heroSubtitle',
  'heroImage',
  'heroCtaLabel',
  'heroCtaLink',
  'announcementText',
  'announcementActive',
];

function readCachedHome() {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Navegación privada, cuota llena o un JSON corrupto de una versión
    // anterior: se sigue como hasta ahora, esperando a la API.
    return null;
  }
}

function cacheHome(content) {
  try {
    const subset = {};

    for (const field of CACHED_FIELDS) {
      subset[field] = content?.[field] ?? '';
    }

    localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(subset));
  } catch {
    // Guardar la caché es una mejora, no un requisito: si falla, la portada
    // funciona igual.
  }
}

export default function Home() {
  const { isDark } = useContext(ThemeContext);
  const [authors, setAuthors] = useState([]);
  const [home, setHome] = useState(readCachedHome);
  const [focusSessions, setFocusSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthors();
    loadHomeContent();
    loadFocusGroup();
  }, []);

  const loadAuthors = async () => {
    try {
      const response = await getAllAuthors();
      if (response.ok && response.authors) {
        setAuthors(response.authors.slice(0, 4));
      }
    } catch (err) {
      console.error('Error cargando autores:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHomeContent = async () => {
    try {
      const response = await getHomeContent();
      if (response.ok) {
        setHome(response.home);
        cacheHome(response.home);
      }
    } catch (err) {
      // La portada tiene que verse igual aunque la configuración no cargue:
      // sin `home`, cada campo cae en su valor original de diseño.
      console.error('Error cargando el contenido de la portada:', err);
    }
  };

  const loadFocusGroup = async () => {
    try {
      const response = await getFocusGroupSessions();
      setFocusSessions(response.sessions || []);
    } catch (err) {
      // La portada se ve igual sin esto: la tarjeta del grupo focal cae en su
      // texto fijo y sigue llevando a la sección.
      console.error('Error cargando el grupo focal:', err);
    }
  };

  // Lo que se anuncia en portada es la próxima reunión (o la que está en curso).
  // Si no hay ninguna programada, la tarjeta cuenta cuántos temas hay abiertos.
  const nextMeeting = focusSessions
    .filter((item) => item.type === FOCUS_GROUP_TYPES.SYNC && meetingState(item) !== 'finalizado')
    .sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''))[0];

  const openTopicsCount = focusSessions.filter((item) => item.type === FOCUS_GROUP_TYPES.ASYNC).length;

  const heroImage = home?.heroImage || DEFAULT_HERO_IMAGE;
  const customTitle = home?.heroTitle?.trim();
  const customSubtitle = home?.heroSubtitle?.trim();
  const showAnnouncement = home?.announcementActive && home?.announcementText?.trim();
  const featuredWorks = home?.featuredWorks || [];
  const events = Array.isArray(home?.events) ? home.events : [];

  return (
    <>
      <style>{`
        /* 1. Scrollbar personalizada para mayor usabilidad y estética */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? 'var(--color-gray-950)' : 'var(--color-gray-50)'};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-300)'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'var(--color-gray-600)' : 'var(--color-gray-400)'};
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
        isDark ? 'bg-gray-950 text-stone-200' : 'bg-gray-50 text-stone-800'
      }`}>
        <Navbar />

        <HomeInvitationPopup
          popups={home?.popups || []}
          active={Boolean(home?.popupsActive)}
          isDark={isDark}
        />

        {/* ================= HERO SECTION ================= */}
        {/* El recorte NO va en la sección: el panel de resultados del buscador
            cuelga por debajo del hero y `overflow-hidden` aquí lo cortaba por la
            mitad. Se recortan solo las decoraciones, que es lo que de verdad se
            sale (la imagen va a escala 1.05 y los desenfoques miden 500px). */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center py-16 px-4 sm:px-8">
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Imagen de fondo. Es decorativa (el texto va encima), así que el alt
                va vacío para que un lector de pantalla no la anuncie. */}
            <img
              src={heroImage}
              alt=""
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover z-0 scale-105 pointer-events-none"
            />

            {/* Oscurecimiento de contraste sobre el video */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-stone-950/75 via-stone-950/80 to-stone-950/95 pointer-events-none" />

            {/* Elementos de fondo con blur y animación de flotación */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none animate-float" />
            <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-yellow-700/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

            {/* Capa de textura de ruido para sensación táctil */}
            <div className="absolute inset-0 bg-noise pointer-events-none opacity-40 z-10" />
          </div>

          {/* Contenido del Hero */}
          <div className="relative z-20 max-w-5xl mx-auto text-center px-4">
            <div className="inline-flex items-center gap-2 bg-stone-950/60 backdrop-blur-md border border-amber-500/30 text-amber-300 px-5 py-2 rounded-full text-xs sm:text-sm font-medium mb-8 shadow-2xl shadow-amber-900/20 hover:border-amber-400/50 transition-colors cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
              Ecosistema Literario del Cesar
            </div>

            {/* Sin título personalizado se conserva el original con su
                degradado en dos partes. Con uno, se pinta entero en degradado:
                partirlo en dos obligaría al admin a conocer el truco de maquetado. */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-stone-100 mb-8 leading-[1.1] tracking-tight">
              {customTitle ? (
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-brand-300 bg-clip-text text-transparent box-decoration-clone pr-[0.14em] -mr-[0.14em]">
                  {customTitle}
                </span>
              ) : (
                <>
                  Donde las palabras <br className="hidden sm:block" />
  
                  <span className="italic font-normal bg-gradient-to-r from-amber-200 via-amber-400 to-brand-300 bg-clip-text text-transparent box-decoration-clone pr-[0.14em] -mr-[0.14em]">
                    encuentran su libertad
                  </span>
                </>
              )}
            </h1>

            <p className="text-stone-300 text-lg sm:text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
              {customSubtitle
                || 'Un portal para explorar la memoria, el ensayo y la narrativa viva de Valledupar y el Caribe colombiano.'}
            </p>

            <SiteSearch />

            {home?.heroCtaLabel?.trim() && (
              <Link
                to={home.heroCtaLink || '/stories'}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-500 text-stone-950 font-bold text-sm sm:text-base hover:bg-amber-400 transition-colors shadow-2xl shadow-amber-900/30"
              >
                {home.heroCtaLabel} <span className="text-lg">→</span>
              </Link>
            )}
          </div>
          
          {/* Indicador de scroll para guiar al usuario */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-60 animate-bounce">
            <span className="text-[10px] uppercase tracking-widest text-stone-400">Descubrir</span>
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </section>

        {/* ================= AVISO EN PORTADA ================= */}
        {showAnnouncement && (
          <div
            role="status"
            className={`px-4 py-4 text-center text-sm sm:text-base font-medium border-b ${
              isDark
                ? 'bg-amber-950/60 text-amber-200 border-amber-900/50'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <span className="mr-2" aria-hidden="true">📣</span>
            {home.announcementText}
          </div>
        )}

        {/* ================= AGENDA DE EVENTOS =================
            Va justo debajo del aviso y por encima de todo lo demás: un evento
            tiene fecha de caducidad, y anunciarlo por debajo del catálogo es no
            anunciarlo. */}
        <EventAgenda events={events} isDark={isDark} />

        {/* ================= ESCRITO DE ENTRADA =================
            La editorial que abre la portada. Va por debajo de la agenda —un
            evento caduca y el escrito no— y por encima del catálogo, que es
            donde se lee antes de ponerse a mirar obras. Se retira sola si el
            admin no ha escrito nada o tiene el interruptor apagado. */}
        <HomeEditorial content={home} isDark={isDark} />

        {/* ================= OBRAS DESTACADAS ================= */}
        {featuredWorks.length > 0 && (
          <section className={`py-20 px-4 sm:px-8 transition-colors ${isDark ? 'bg-stone-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400">
                  Selección del equipo
                </span>
                <h2 className={`text-4xl sm:text-5xl font-serif font-bold mt-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Obras Destacadas
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredWorks.map((work) => (
                  <Link
                    key={work.id}
                    to={`/stories?obra=${work.id}`}
                    className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/10 ${
                      isDark
                        ? 'bg-stone-900/40 border-stone-800 hover:border-amber-500/40'
                        : 'bg-white border-stone-200 hover:border-amber-600/40'
                    }`}
                  >
                    {work.cover && (
                      <div className="h-52 overflow-hidden">
                        <img
                          src={work.cover}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {work.genre && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3 border border-amber-500/20">
                          {work.genre}
                        </span>
                      )}

                      <h3 className={`text-xl font-serif font-bold mb-1.5 leading-snug ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                        {work.title}
                      </h3>

                      <p className={`text-sm mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {work.author}
                      </p>

                      {work.description && (
                        <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                          {work.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= SECCIONES PRINCIPALES (BENTO) ================= */}
        <section className={`relative py-24 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
              <Link
                to="/poleversia"
                className={`block lg:col-span-7 group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/10 shimmer-card ${
                isDark ? 'bg-stone-900/40 border-stone-800 hover:border-amber-500/40' : 'bg-white border-stone-200 hover:border-amber-600/40'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                  <div className="relative h-72 sm:h-auto overflow-hidden">
                    <img src="https://res.cloudinary.com/j7q2huvz/image/upload/v1785901071/librepalaras/covers/ahjqwbr2tlxlfz5vku4j.png" alt="Revista Poleversia" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-stone-950/80 to-transparent sm:hidden" />
                  </div>
                  <div className="p-8 sm:p-10 flex flex-col justify-between relative z-10">
                    <div>
                      <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
                        Publicación Periódica
                      </span>
                      <h3 className={`text-3xl font-serif font-bold mb-4 leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                        Revista Poleversia
                      </h3>
                      <p className={`text-base leading-relaxed mb-8 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        Un diálogo multidisciplinario entre la literatura, las artes plásticas y el pensamiento crítico territorial.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-4 transition-all duration-300">
                      Explorar Ediciones <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>
              </Link>

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
                <a href="/literature" className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-4 transition-all duration-300">
                  Ver Catálogo Completo <span className="text-lg">→</span>
                </a>
              </div>

              {/* Card Tercera (Ancho Completo): Grupo Focal. Anuncia el próximo
                  encuentro real en cuanto el admin programa uno. */}
              <Link
                to="/grupo-focal"
                className={`block lg:col-span-12 group relative overflow-hidden rounded-3xl border p-8 sm:p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-900/10 shimmer-card ${
                isDark ? 'bg-stone-900/40 border-stone-800 hover:border-amber-500/40' : 'bg-white border-stone-200 hover:border-amber-600/40'
              }`}>
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-full md:w-1/3 h-64 overflow-hidden rounded-2xl shrink-0 relative">
                    <img src={focusGroupLogo} alt={FOCUS_GROUP_NAME} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 to-transparent md:hidden" />
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col justify-center">
                    <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20 w-fit">
                      Comunidad & Debate
                    </span>
                    <h3 className={`text-3xl font-serif font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {FOCUS_GROUP_NAME}
                    </h3>
                    <p className={`text-base leading-relaxed mb-6 max-w-2xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      La Cátedra reúne a la comunidad por videollamada; la Tertulia deja el tema abierto
                      al comentario. Un espacio para pensar en voz alta la memoria, la palabra y el Caribe.
                    </p>

                    {nextMeeting ? (
                      <div className={`mb-8 rounded-2xl border px-5 py-4 max-w-2xl ${
                        isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-stone-50 border-stone-200'
                      }`}>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400 mb-1">
                          {meetingState(nextMeeting) === 'en_curso' ? 'En curso ahora' : 'Próximo encuentro'}
                        </p>
                        <p className={`font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                          {nextMeeting.title}
                        </p>
                        <p className={`text-sm mt-1 first-letter:uppercase ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                          {new Date(nextMeeting.scheduledAt).toLocaleString('es-CO', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ) : openTopicsCount > 0 ? (
                      <p className={`mb-8 text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        {openTopicsCount} {openTopicsCount === 1 ? 'tema abierto' : 'temas abiertos'} esperando tu comentario.
                      </p>
                    ) : null}

                    <div>
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:gap-4 transition-all duration-300">
                        Unirse a la conversación <span className="text-lg">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= AUTORES DESTACADOS ================= */}
        <section className={`relative py-24 px-4 sm:px-8 border-y transition-colors ${
          isDark ? 'bg-stone-950 border-stone-800/80' : 'bg-gray-100 border-stone-200'
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
                      <img src={author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=300`} alt={author.name} className="relative w-full h-full object-cover rounded-full ring-2 ring-amber-500/30 group-hover:ring-amber-500 transition-all duration-500 grayscale group-hover:grayscale-0" />
                    </div>
                    {/* La tarjeta presenta a la persona, no su catálogo: foto,
                        nombre y un adelanto de la semblanza. El recuento de
                        obras se quitó a propósito, porque dejaba a quien acaba
                        de entrar anunciado con un "0 publicaciones". */}
                    <h3 className={`text-xl font-serif font-bold text-center ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {author.name}
                    </h3>
                    {author.description && (
                      /* Adelanto, no ficha completa: recortado a cuatro líneas
                         porque las tarjetas comparten fila y una semblanza
                         larga estiraría la sección entera. Los párrafos se
                         respetan igual. */
                      <p className={`text-sm text-center leading-relaxed mt-4 whitespace-pre-line line-clamp-4 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        {author.description}
                      </p>
                    )}
                  </div>
                  <div className="text-center pt-6 mt-6 border-t border-stone-500/10">
                    {/* Llevaba a /stories, que es el listado de textos: la
                        semblanza completa se lee en el directorio de autores. */}
                    <Link to="/authors" className="text-xs font-bold tracking-wider uppercase text-stone-400 hover:text-amber-500 transition-colors duration-300 flex items-center justify-center gap-1 group-hover:gap-2">
                      Ver Semblanza <span>→</span>
                    </Link>
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
        <section className={`relative py-24 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
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
                  <Link
                    to="/login"
                    className="group relative bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40 hover:-translate-y-1 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Postular Texto
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </Link>
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
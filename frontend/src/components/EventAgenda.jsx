import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';



const AUTOPLAY_MS = 5000;

/** Cuántas tarjetas caben a la vez. Coincide con el punto de corte `md` de Tailwind. */
function useCardsPerView() {
  const [perView, setPerView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 2 : 1
  );

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const sync = (event) => setPerView(event.matches ? 2 : 1);

    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return perView;
}

/** Quien pide menos movimiento no debería recibir un carrusel que gira solo. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = (event) => setReduced(event.matches);

    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduced;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Un evento que ya pasó deja de anunciarse solo. El corte es el final del día
 * de la fecha, no la hora exacta: un recital de las 7 p.m. debe seguir en la
 * portada a las 8, cuando la gente todavía puede llegar. Los eventos sin fecha
 * (una convocatoria abierta, una inscripción permanente) no caducan nunca.
 */
function isUpcoming(event, now = new Date()) {
  const date = parseDate(event?.date);

  if (!date) return true;

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return endOfDay >= now;
}

function EventCard({ event, isDark, highlighted = false }) {
  const date = parseDate(event.date);
  const isExternal = !event.link?.startsWith('/');

  // Las tarjetas van sobre la franja de color, así que son la superficie clara
  // (u oscura, según el tema) que destaca sobre ella. El realce al pasar el
  // ratón es un desplazamiento hacia arriba: sobre un fondo de color, cambiar
  // solo el borde apenas se nota.
  const cardClasses = `group relative flex gap-5 rounded-2xl p-6 pl-7 h-full overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 ${
    isDark
      ? 'bg-stone-900 border-stone-800 shadow-lg shadow-black/30 hover:border-stone-700'
      : 'bg-white border-stone-200 shadow-md shadow-stone-900/[0.06] hover:shadow-xl hover:shadow-stone-900/10'
  }`;

  const content = (
    <>
      {/* Franja de acento pegada al canto: da color a la tarjeta sin robarle
          espacio al contenido. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2.5 ${
          highlighted ? 'bg-amber-500' : 'bg-brand-500'
        }`}
      />

      {date && (
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl flex-shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-700/20">
          <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
          <span className="text-[10px] font-bold tracking-widest mt-0.5 opacity-90">
            {MONTHS[date.getMonth()]}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {highlighted && (
          <span className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-amber-500 opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-amber-500" />
            </span>
            Lo más próximo
          </span>
        )}

        <h3 className={`text-lg font-serif font-bold leading-snug pr-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
          {event.title}
        </h3>

        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          {date && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              {date.toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {event.place && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">{event.place}</span>
            </span>
          )}
        </div>

        {event.description && (
          <p className={`mt-3 text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {event.description}
          </p>
        )}

        <span className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-bold text-white bg-brand-700 group-hover:bg-brand-800 transition-colors duration-300">
          Más información <span className="text-base">→</span>
        </span>
      </div>

      {isExternal && (
        <ArrowUpRight
          className={`absolute top-5 right-5 w-4 h-4 transition-colors ${
            isDark ? 'text-stone-600 group-hover:text-amber-400' : 'text-stone-300 group-hover:text-amber-600'
          }`}
          aria-hidden="true"
        />
      )}
    </>
  );

  // `noopener` es obligatorio en los enlaces externos: sin él, la página de
  // destino puede manipular la pestaña que la abrió.
  return isExternal ? (
    <a href={event.link} target="_blank" rel="noopener noreferrer" className={cardClasses}>
      {content}
    </a>
  ) : (
    <Link to={event.link} className={cardClasses}>
      {content}
    </Link>
  );
}

function EventCarousel({ events, isDark, featuredId }) {
  const perView = useCardsPerView();
  const reducedMotion = usePrefersReducedMotion();
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const pageCount = Math.ceil(events.length / perView);

  // Al pasar de móvil a escritorio hay menos páginas: sin acotarlo, el carrusel
  // se quedaría desplazado a una página que ya no existe, mostrando un hueco.
  // Se acota al derivar en vez de corregir el estado desde un efecto, así no
  // hay un render intermedio con el valor fuera de rango; y si se vuelve a
  // móvil, el carrusel regresa a la página donde estaba.
  const safePage = Math.min(page, pageCount - 1);

  const goTo = (next) => setPage(((next % pageCount) + pageCount) % pageCount);

  // El avance automático se detiene mientras el puntero está encima o el foco
  // dentro: nadie debería perder de vista la tarjeta que está leyendo.
  useEffect(() => {
    if (paused || reducedMotion || pageCount < 2) return undefined;

    const timer = setInterval(() => {
      setPage((current) => (current + 1) % pageCount);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [paused, reducedMotion, pageCount]);

  const controlClasses = `p-2.5 rounded-full border transition-colors ${
    isDark
      ? 'border-stone-700 text-stone-300 hover:bg-stone-800 hover:border-stone-600'
      : 'border-stone-300 text-stone-600 bg-white/70 hover:bg-white hover:border-stone-400'
  }`;

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label="Próximos eventos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        {/* El carril se desplaza una "vista" completa por página; las tarjetas
            miden el 100 % o el 50 % del contenedor, así que un 100 % de
            desplazamiento avanza exactamente las que se ven. */}
        <div
          className={`flex -mx-3 ${reducedMotion ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{ transform: `translateX(-${safePage * 100}%)` }}
        >
          {events.map((event, index) => {
            const isVisible = Math.floor(index / perView) === safePage;

            return (
              <div
                key={event.id || event.link}
                className="w-full md:w-1/2 flex-shrink-0 px-3"
                // Las tarjetas fuera de vista no deben recibir el tabulador ni
                // ser leídas: son enlaces, y si no, el teclado salta a algo
                // que no está en pantalla.
                inert={!isVisible}
                aria-hidden={!isVisible}
              >
                <EventCard event={event} isDark={isDark} highlighted={event.id === featuredId} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-8">
        <div className="flex items-center gap-2" role="tablist" aria-label="Páginas de eventos">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === safePage}
              aria-label={`Ver eventos ${index + 1} de ${pageCount}`}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === safePage
                  ? 'w-8 bg-amber-600'
                  : isDark ? 'w-2 bg-stone-700 hover:bg-stone-600' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => goTo(safePage - 1)} aria-label="Eventos anteriores" className={controlClasses}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => goTo(safePage + 1)} aria-label="Eventos siguientes" className={controlClasses}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** El evento con fecha más cercana, para destacarlo entre los demás. */
function nearestEventId(events) {
  const dated = events.filter((event) => parseDate(event.date));

  if (dated.length === 0) return null;

  return dated.reduce((soonest, event) =>
    parseDate(event.date) < parseDate(soonest.date) ? event : soonest
  ).id;
}

export default function EventAgenda({ events = [], isDark }) {
  const upcoming = events.filter((event) => isUpcoming(event));

  if (upcoming.length === 0) {
    return null;
  }

  const featuredId = nearestEventId(upcoming);

  return (
    /**
     * La agenda se separa del resto de la portada por un fondo propio, pero
     * apenas teñido: lo que llama la atención son las tarjetas y sus acentos de
     * color, no el fondo. Un color pleno detrás compite con ellos y cansa.
     */
    <section
      className={`relative py-20 px-4 sm:px-8 overflow-hidden border-y ${
        isDark ? 'border-stone-800' : 'border-stone-200/80'
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-b ${
          isDark
            ? 'from-stone-950 via-brand-950/40 to-stone-950'
            : 'from-stone-50 via-brand-50/70 to-stone-100/60'
        }`}
      />

      {/* Halos muy tenues: dan profundidad al fondo sin llegar a leerse como
          manchas de color. */}
      <div aria-hidden="true" className="absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full bg-amber-500/[0.07] blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-brand-400/[0.07] blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row md:items-end justify-between mb-12 border-b pb-8 ${
          isDark ? 'border-stone-800' : 'border-stone-300/60'
        }`}>
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase bg-amber-500/12 text-amber-700 dark:text-amber-400 ring-1 ring-amber-600/20">
              Agenda
            </span>
            <h2 className={`text-4xl sm:text-5xl font-serif font-bold mt-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Próximos eventos
            </h2>
          </div>
          <p className={`text-base sm:text-lg max-w-md mt-6 md:mt-0 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Encuentros, lanzamientos y convocatorias de Librepalabras y de la comunidad literaria del Caribe.
          </p>
        </div>

        {/* Con uno o dos eventos no hay nada que pasar: un carrusel de una sola
            página son controles que no llevan a ninguna parte. */}
        {upcoming.length > 2 ? (
          <EventCarousel events={upcoming} isDark={isDark} featuredId={featuredId} />
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${upcoming.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {upcoming.map((event) => (
              <EventCard
                key={event.id || event.link}
                event={event}
                isDark={isDark}
                highlighted={event.id === featuredId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

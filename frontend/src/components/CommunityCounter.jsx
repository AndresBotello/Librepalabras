import { useEffect, useRef, useState } from 'react';
import { getPublicStats } from '../services/api';

// Con pocas cuentas la cifra no luce: mejor no pintarla hasta que valga la pena
// presumir. Se puede bajar o poner en 0 para mostrarla siempre.
const MIN_TO_SHOW = 20;

// Cada cuánto se vuelve a preguntar mientras la pestaña está a la vista. Es lo
// que permite ver crecer la cifra en vivo cuando alguien se registra.
const POLL_INTERVAL_MS = 20 * 1000;

const numberFormat = new Intl.NumberFormat('es-CO');

/**
 * Cifra de usuarios registrados. Solo recibe un número del servidor; si la
 * petición falla o la cifra aún es pequeña, no pinta nada. Cuando la cifra sube
 * mientras se mira la página, el número "salta" y flota un +1 (o +N).
 */
export default function CommunityCounter({ isDark }) {
  const [total, setTotal] = useState(0);
  // `key` cambia en cada subida para reiniciar la animación aunque dos
  // registros seguidos sumen lo mismo.
  const [bump, setBump] = useState(null);
  const lastTotal = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      getPublicStats()
        .then((response) => {
          const count = Number(response?.stats?.totalUsers);
          if (cancelled || !response?.ok || !Number.isFinite(count)) return;

          // La primera lectura solo fija la cifra: animar de 0 a 40 sería
          // presumir "40 nuevos" cuando no se registró nadie.
          if (lastTotal.current > 0 && count > lastTotal.current) {
            setBump({ key: Date.now(), delta: count - lastTotal.current });
          }

          lastTotal.current = count;
          setTotal(count);
        })
        .catch(() => {
          // Es un adorno de la portada: si falla, se conserva la última cifra.
        });
    };

    refresh();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);

    // Al volver a la pestaña no se espera al siguiente intervalo.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (total < MIN_TO_SHOW || total <= 0) return null;

  return (
    <section
      aria-label="Comunidad de LiberaPalabras"
      className={`relative py-16 px-4 sm:px-8 border-y transition-colors ${
        isDark ? 'bg-stone-950 border-stone-800/80' : 'bg-white border-stone-200'
      }`}
    >
      <style>{`
        @keyframes counter-pop {
          0% { transform: scale(1); }
          35% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes counter-float {
          0% { opacity: 0; transform: translateY(8px) scale(0.8); }
          20% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; transform: translateY(-14px) scale(1); }
          100% { opacity: 0; transform: translateY(-26px) scale(1); }
        }
        .counter-pop { animation: counter-pop 0.7s ease-out; }
        .counter-float { animation: counter-float 2.4s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .counter-pop { animation: none; }
          .counter-float { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-48 bg-amber-500/10 rounded-full blur-[90px]" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Nuestra comunidad
        </span>

        <p className="relative mt-4 font-serif font-bold leading-none text-6xl sm:text-7xl md:text-8xl">
          {/* Con `key` la animación se reinicia solo cuando hay un registro nuevo. */}
          <span
            key={bump ? bump.key : 'initial'}
            className={`inline-block ${bump ? 'counter-pop' : ''}`}
          >
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent tabular-nums">
              {numberFormat.format(total)}
            </span>
          </span>

          {bump && (
            <span
              key={`plus-${bump.key}`}
              aria-hidden="true"
              className="counter-float absolute left-1/2 -top-6 ml-24 sm:ml-32 text-2xl sm:text-3xl text-emerald-500 pointer-events-none"
            >
              +{bump.delta}
            </span>
          )}
        </p>

        <p className={`mt-4 text-lg sm:text-xl ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
          Lectores y escritores ya hacen parte de LiberaPalabras.
        </p>
      </div>
    </section>
  );
}

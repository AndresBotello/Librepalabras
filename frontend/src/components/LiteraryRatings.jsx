import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { addRating } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

/**
 * Valoración de una obra.
 *
 * El dorado va escrito a mano y no sale de la paleta a propósito: en este
 * proyecto `amber` y `yellow` están redefinidos a verde, y unas estrellas
 * verdes no se leen como una valoración. Es el único color suelto del
 * componente y se usa solo en las estrellas y en las barras.
 */
const GOLD = '#c9a227';

const STAR_LABELS = ['', 'No me gustó', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

function Stars({ value, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);

        return (
          <Star
            key={star}
            size={size}
            strokeWidth={1.5}
            className={filled ? '' : 'opacity-30'}
            style={{ color: GOLD, fill: filled ? GOLD : 'transparent' }}
          />
        );
      })}
    </span>
  );
}

export default function LiteraryRatings({ workId, ratings = [], averageRating = 0, isDark, onRatingAdded }) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { notify } = useDialog();

  const userRatingData = ratings.find(r => r.userId === user?.uid);
  const currentScore = hoverRating || userRating || userRatingData?.score || 0;
  const hasRatings = ratings.length > 0;

  const handleSubmitRating = async (score) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await addRating(workId, score);
      if (response.ok) {
        setUserRating(score);
        if (onRatingAdded) onRatingAdded(response.averageRating);
      }
    } catch (err) {
      // Antes el error solo iba a la consola: quien calificaba veía que no
      // pasaba nada y no sabía por qué.
      notify.error(err.message || 'No se pudo registrar tu valoración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-6 ${
        isDark ? 'text-slate-500' : 'text-stone-400'
      }`}>
        Valoración de los lectores
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-10">
        {/* Nota media */}
        <div className="flex-shrink-0 text-center sm:text-left">
          {hasRatings ? (
            <>
              <p className={`text-5xl font-serif font-bold leading-none ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {averageRating.toFixed(1)}
              </p>
              <div className="mt-2.5 flex justify-center sm:justify-start">
                <Stars value={averageRating} size={17} />
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                {ratings.length} {ratings.length === 1 ? 'valoración' : 'valoraciones'}
              </p>
            </>
          ) : (
            <>
              <p className={`text-2xl font-serif italic leading-snug ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                Aún sin<br />valoraciones
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                Sé la primera persona en opinar
              </p>
            </>
          )}
        </div>

        {/* Reparto por número de estrellas. Sin valoraciones no se pinta: cinco
            barras vacías solo ocupan sitio y no dicen nada. */}
        {hasRatings && (
          /* Acotadas: estiradas de lado a lado en una columna de lectura
             ancha, cinco barras finas se ven desangeladas. */
          <div className="flex-1 min-w-0 max-w-sm space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratings.filter(r => r.score === stars).length;
              const percent = (count / ratings.length) * 100;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className={`text-[11px] tabular-nums w-2 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                    {stars}
                  </span>
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: GOLD }}
                    />
                  </div>
                  <span className={`text-[11px] tabular-nums w-6 text-right ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tu valoración */}
      <div className={`mt-8 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
        {isAuthenticated ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-sm font-serif font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                {userRatingData ? 'Tu valoración' : '¿Qué te pareció esta obra?'}
              </p>
              <p className={`text-xs mt-1 h-4 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                {/* La etiqueta acompaña al puntero mientras se elige; al soltar
                    queda la nota registrada. Alto fijo para que la fila no salte. */}
                {currentScore ? STAR_LABELS[currentScore] : 'Pulsa una estrella para valorarla'}
              </p>
            </div>

            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleSubmitRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onFocus={() => setHoverRating(star)}
                  onBlur={() => setHoverRating(0)}
                  disabled={loading}
                  aria-label={`${star} de 5 estrellas`}
                  aria-pressed={star === (userRating || userRatingData?.score)}
                  className="p-1 rounded transition-transform hover:scale-125 disabled:opacity-50 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                >
                  <Star
                    size={26}
                    strokeWidth={1.5}
                    className={star <= currentScore ? '' : 'opacity-25'}
                    style={{ color: GOLD, fill: star <= currentScore ? GOLD : 'transparent' }}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
            <Link
              to="/login"
              className={`font-semibold underline ${isDark ? 'text-amber-400' : 'text-brand-700'}`}
            >
              Inicia sesión
            </Link>{' '}
            para valorar esta obra.
          </p>
        )}
      </div>
    </section>
  );
}

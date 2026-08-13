import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookHeart } from 'lucide-react';
import osmen from '../assets/autores/osmen.webp';
import jorge from '../assets/autores/jorge.webp';
import miguel from '../assets/autores/miguel.webp';

/**
 * Los tres autores destacados de la biblioteca.
 *
 * Van fijos en el código, con la foto como archivo del proyecto, en vez de
 * pedirlos a la API. La razón es el peso: `GET /api/authors` devuelve TODOS los
 * autores con su biografía completa (1,4 KB por autor), así que una barra que
 * solo enseña foto y nombre acabaría descargando decenas de KB inútiles en
 * cuanto el catálogo crezca. Así el bloque cuesta 0 peticiones y 7,6 KB de
 * imágenes, y no crece nunca.
 *
 * El precio de esta decisión: cambiar quién aparece es tocar este archivo, no
 * una pantalla del panel. Si algún día hay que rotarlos a menudo, conviene
 * migrar a un endpoint que devuelva solo estos tres campos.
 *
 * Las fotos salen de la ficha de cada autor, reducidas a 144 px y convertidas a
 * WebP (la original de una de ellas pesaba 155 KB).
 */
const FEATURED = [
  { name: 'Osmen Ospino Zárate', photo: osmen },
  { name: 'Jorge Elías Ospina Campo', photo: jorge },
  { name: 'Miguel Barrios Payares', photo: miguel },
];

/**
 * `variant`:
 *   - "sidebar": columna estrecha del listado, tres filas apiladas.
 *   - "row":     una sola tarjeta ancha con los tres en fila, para la vista de
 *                lectura, donde el texto ocupa toda la columna y una barra
 *                vertical no tendría dónde ir.
 */
export default function FeaturedAuthors({ isDark, variant = 'sidebar' }) {
  const surface = isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-stone-200';

  if (variant === 'row') {
    return (
      <section className={`rounded-2xl border p-6 sm:p-8 ${surface}`} aria-label="Autores destacados">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
          <h2 className={`text-[11px] font-bold uppercase tracking-widest ${
            isDark ? 'text-slate-500' : 'text-stone-400'
          }`}>
            Voces de la casa
          </h2>
          <Link
            to="/authors"
            className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:text-brand-800'
            }`}
          >
            Ver todos los autores
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURED.map((author) => (
            <li key={author.name} className="flex items-center gap-3.5">
              <img
                src={author.photo}
                alt={`Retrato de ${author.name}`}
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className={`w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ${
                  isDark ? 'ring-slate-800' : 'ring-stone-100'
                }`}
              />
              <div className="min-w-0">
                <p className={`font-serif font-bold text-sm leading-snug ${
                  isDark ? 'text-stone-100' : 'text-stone-900'
                }`}>
                  {author.name}
                </p>
                <p className={`text-[11px] uppercase tracking-wider mt-0.5 ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}>
                  Autor
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className={`mt-6 pt-5 border-t text-sm leading-relaxed ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-stone-100 text-stone-600'
        }`}>
          <span className={`font-serif font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            Un espacio para compartir la lectura.
          </span>{' '}
          Aquí no solo se lee: se comenta, se recomienda y se conversa. Detrás de cada obra hay
          alguien de la región que la escribió.
        </p>
      </section>
    );
  }

  return (
    <aside className="space-y-6" aria-label="Autores destacados">
      <section className={`rounded-2xl border p-5 ${surface}`}>
        <h2 className={`text-[11px] font-bold uppercase tracking-widest mb-5 ${
          isDark ? 'text-slate-500' : 'text-stone-400'
        }`}>
          Voces de la casa
        </h2>

        <ul className="space-y-1">
          {FEATURED.map((author, index) => (
            <li key={author.name}>
              {index > 0 && (
                <div className={`h-px my-3 ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`} />
              )}
              <div className="flex items-center gap-3.5">
                {/* `width`/`height` fijos: sin ellos la fila salta de sitio
                    cuando la imagen termina de cargar. */}
                <img
                  src={author.photo}
                  alt={`Retrato de ${author.name}`}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className={`w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ${
                    isDark ? 'ring-slate-800' : 'ring-stone-100'
                  }`}
                />
                <div className="min-w-0">
                  <p className={`font-serif font-bold text-sm leading-snug ${
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  }`}>
                    {author.name}
                  </p>
                  <p className={`text-[11px] uppercase tracking-wider mt-0.5 ${
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                    Autor
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          to="/authors"
          className={`inline-flex items-center gap-1.5 mt-5 pt-4 border-t w-full text-sm font-semibold transition-colors ${
            isDark
              ? 'border-slate-800 text-amber-400 hover:text-amber-300'
              : 'border-stone-100 text-brand-700 hover:text-brand-800'
          }`}
        >
          Ver todos los autores
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      <section className={`rounded-2xl border p-5 ${surface}`}>
        <BookHeart
          className="w-6 h-6 mb-3"
          strokeWidth={1.5}
          style={{ color: 'var(--color-brand-700)' }}
          aria-hidden="true"
        />
        <h2 className={`font-serif font-bold text-lg leading-snug mb-2 ${
          isDark ? 'text-stone-100' : 'text-stone-900'
        }`}>
          Un espacio para compartir la lectura
        </h2>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
          Aquí no solo se lee: se comenta, se recomienda y se conversa. Cada obra tiene su espacio
          de comentarios, y detrás de cada una hay alguien de la región que la escribió.
        </p>
      </section>
    </aside>
  );
}

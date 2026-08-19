import { useEffect, useRef, useState } from 'react';

/**
 * El escrito de entrada de la portada: una editorial que el administrador
 * escribe desde /admin/home, sin tocar código.
 *
 * El cuerpo se pinta con `whitespace-pre-wrap` y NO como HTML. Estos textos
 * llegan pegados desde un procesador de textos y su forma es parte de lo que se
 * publica: la sangría de cada párrafo, los versos citados con su propio
 * margen, los cortes de línea del poema. Interpretar Markdown o HTML obligaría
 * a quien escribe a marcar todo eso a mano —y abriría la portada a que un
 * pegado traiga etiquetas de más—, mientras que respetar el texto tal cual lo
 * conserva exactamente como se redactó.
 */

/**
 * Las tres tipografías que puede elegir el admin. La lista viva es la del
 * servidor (`EDITORIAL_FONTS` en siteConfig.service.js); aquí solo se traduce a
 * una pila de fuentes, y un valor desconocido cae en la serif.
 *
 * Va como estilo en línea y NO como clase de Tailwind (`font-serif` y
 * compañía), aunque la clase sea lo natural, porque en este proyecto no
 * funcionaría: index.css declara `* { font-family: 'Lato' }` fuera de toda
 * capa, y en la cascada de CSS lo que está sin capa gana a lo que está dentro
 * de una, por específico que sea. Las utilidades de Tailwind viven en
 * `@layer utilities`, así que ese asterisco las pisa TODAS. El estilo en línea
 * está por encima de la discusión.
 */
const FONT_STACK = {
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  display: '"Playfair Display", serif',
  sans: '"Lato", sans-serif',
};

// `**negrita**` primero que `*cursiva*`: con la alternancia al revés, los dos
// asteriscos de apertura los mordería la cursiva y saldría un asterismo suelto.
// Ninguna de las dos marcas cruza un salto de línea, para que un asterisco
// impar en un verso no se lleve por delante media página.
const MARKS = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;

/**
 * Convierte las marcas ligeras del escrito en cursiva y negrita de verdad.
 *
 * Se devuelven nodos, no HTML: el cuerpo sigue siendo texto que nadie
 * interpreta, así que la sangría de cada párrafo y los versos citados llegan
 * intactos y un pegado desde Word no puede colar etiquetas en la portada.
 *
 * Un asterisco sin pareja se queda como está —la expresión exige cierre—, que
 * es justo lo que espera quien escribe un asterisco a propósito.
 */
function withMarks(text) {
  return String(text).split(MARKS).map((chunk, index) => {
    if (index % 2 === 0) return chunk;

    // `fontFamily: 'inherit'` no es decorativo: el `* { font-family: 'Lato' }`
    // de index.css alcanza también a estos elementos, y la herencia es lo más
    // débil de la cascada. Sin esto, cada fragmento en cursiva saldría en Lato
    // en mitad de un párrafo en serif.
    if (chunk.startsWith('**')) {
      return (
        <strong key={index} className="font-bold" style={{ fontFamily: 'inherit' }}>
          {chunk.slice(2, -2)}
        </strong>
      );
    }

    return <em key={index} style={{ fontFamily: 'inherit' }}>{chunk.slice(1, -1)}</em>;
  });
}

// Alto al que se recorta el escrito antes de desplegarlo. No es una cifra
// caprichosa: por debajo se lee un par de párrafos, lo justo para saber si el
// texto interesa, y por encima el escrito se come la portada entera.
const COLLAPSED_HEIGHT = 30;

export default function HomeEditorial({ content, isDark }) {
  const [expanded, setExpanded] = useState(false);
  // Solo se ofrece "Seguir leyendo" si el texto de verdad no cabe. Un escrito
  // de tres párrafos con un botón para desplegar tres párrafos es ruido.
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef(null);

  // El cuerpo NO se recorta: `trim` se llevaba la sangría del primer párrafo,
  // que es exactamente lo que hay que conservar. El servidor ya limpia los
  // extremos con ese cuidado, así que aquí solo se pregunta si hay algo escrito.
  const body = content?.editorialBody || '';
  const hasBody = body.trim().length > 0;
  const title = content?.editorialTitle?.trim();
  const kicker = content?.editorialKicker?.trim() || 'Escrito de entrada';
  const epigraph = content?.editorialEpigraph?.trim();
  const author = content?.editorialAuthor?.trim();
  const authorRole = content?.editorialAuthorRole?.trim();
  const active = Boolean(content?.editorialActive);
  // La tipografía general es el suelo; cada sección puede pisarla. Un campo
  // vacío no es un error ni un "sin fuente": es la forma de decir "la general",
  // que es lo que deja cambiar el bloque entero desde un solo desplegable.
  const generalFont = FONT_STACK[content?.editorialFont] || FONT_STACK.serif;
  const fontFor = (field) => FONT_STACK[content?.[field]] || generalFont;

  const titleFont = fontFor('editorialTitleFont');
  const epigraphFont = fontFor('editorialEpigraphFont');
  const bodyFont = fontFor('editorialBodyFont');
  const signatureFont = fontFor('editorialSignatureFont');

  useEffect(() => {
    if (!bodyRef.current) return undefined;

    const node = bodyRef.current;
    // Se mide contra el alto real, no contra el número de caracteres: cuánto
    // ocupa un texto depende del ancho de la ventana y del tamaño de fuente
    // que tenga puesto quien lee.
    const measure = () => {
      const limit = COLLAPSED_HEIGHT * parseFloat(getComputedStyle(node).fontSize || '16');
      setOverflows(node.scrollHeight > limit + 40);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => observer.disconnect();
  }, [body]);

  // Sin cuerpo no hay editorial. El interruptor apagado la retira sin que el
  // admin tenga que borrar lo que escribió.
  if (!active || !hasBody) return null;

  const collapsed = overflows && !expanded;

  return (
    <section
      aria-labelledby={title ? 'editorial-title' : undefined}
      className={`relative px-4 sm:px-8 py-20 sm:py-28 transition-colors ${
        isDark ? 'bg-stone-900' : 'bg-[#faf7f0]'
      }`}
    >
      {/* Filetes finos arriba y abajo: separan el escrito del resto de la
          portada sin meter otra caja con borde y sombra. */}
      <div className={`absolute inset-x-0 top-0 h-px ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />
      <div className={`absolute inset-x-0 bottom-0 h-px ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`} />

      <article className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-amber-600 dark:text-amber-400">
            {kicker}
          </span>

          {title && (
            <h2
              id="editorial-title"
              style={{ fontFamily: titleFont }}
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mt-4 text-balance ${
                isDark ? 'text-stone-100' : 'text-stone-900'
              }`}
            >
              {title}
            </h2>
          )}

          {/* Adorno tipográfico en lugar de una línea a secas: es lo que separa
              el titular del cuerpo en una página impresa. */}
          <div className="flex items-center justify-center gap-3 mt-6" aria-hidden="true">
            <span className={`h-px w-10 ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`} />
            <span className={`text-sm font-serif ${isDark ? 'text-amber-500/70' : 'text-amber-700/60'}`}>❧</span>
            <span className={`h-px w-10 ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`} />
          </div>
        </header>

        {epigraph && (
          <blockquote
            style={{ fontFamily: epigraphFont }}
            className={`mb-12 pl-5 border-l-2 whitespace-pre-line italic text-base sm:text-lg leading-relaxed ${
              isDark ? 'border-amber-500/40 text-stone-400' : 'border-amber-600/40 text-stone-600'
            }`}
          >
            {withMarks(epigraph)}
          </blockquote>
        )}

        <div className="relative">
          <div
            ref={bodyRef}
            lang="es"
            style={{
              fontFamily: bodyFont,
              ...(collapsed ? { maxHeight: `${COLLAPSED_HEIGHT}em` } : null),
            }}
            className={`whitespace-pre-wrap text-[1.0625rem] sm:text-lg leading-[1.9] hyphens-auto sm:text-justify overflow-hidden ${
              isDark ? 'text-stone-300' : 'text-stone-800'
            }`}
          >
            {withMarks(body)}
          </div>

          {collapsed && (
            /* Degradado hasta el fondo de la sección, no un blanco fijo: si no,
               en modo oscuro aparecería una banda clara sobre el texto. */
            <div
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent pointer-events-none ${
                isDark ? 'from-stone-900' : 'from-[#faf7f0]'
              }`}
            />
          )}
        </div>

        {overflows && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className={`text-sm font-bold tracking-wider uppercase px-6 py-2.5 rounded-full border transition-colors ${
                isDark
                  ? 'border-stone-700 text-amber-400 hover:bg-stone-800 hover:border-amber-500/40'
                  : 'border-stone-300 text-amber-700 hover:bg-white hover:border-amber-600/40'
              }`}
            >
              {expanded ? 'Leer menos' : 'Seguir leyendo'}
            </button>
          </div>
        )}

        {author && (
          <footer className={`mt-14 pt-8 border-t text-right ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
            <p
              style={{ fontFamily: signatureFont }}
              className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
            >
              {author}
            </p>
            {authorRole && (
              <p className={`text-xs tracking-[0.15em] uppercase mt-1.5 ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                {authorRole}
              </p>
            )}
          </footer>
        )}
      </article>
    </section>
  );
}

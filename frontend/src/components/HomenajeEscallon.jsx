import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import retratoAmhed from '../assets/Amhed.jpeg';

/**
 * Encuadre del retrato.
 *
 * La foto original (706 × 876) es un plano de medio cuerpo con el rostro en el
 * tercio superior. Recortada con `object-cover` sin más, la cara quedaría muy
 * arriba dentro del círculo y sobraría escritorio.
 *
 * En vez de eso se amplía al 175 % dentro de un contenedor redondo y se
 * desplaza para que el rostro caiga en el centro óptico —algo por encima del
 * centro geométrico, que es donde el ojo espera una cara en un retrato—.
 *
 * El 175 % es el techo útil: deja la cabeza ocupando algo más de la mitad del
 * círculo y recorta el pasillo del fondo, pero todavía toma 403 px del original
 * para pintar un círculo de 176 px, así que no hay ampliación real ni siquiera
 * en pantallas de alta densidad. Por encima de eso la foto empieza a verse
 * blanda.
 */
const ENCUADRE_RETRATO = {
  width: '175%',
  left: '-28.6%',
  top: '-10.5%',
};

/**
 * Homenaje a Amhed Escallón Gamarra, al cierre de la página de concursos.
 *
 * Va al final y en voz baja a propósito: quien entra a /concursos viene a ver
 * convocatorias, y un homenaje colocado arriba se leería como un anuncio. Aquí
 * funciona como una nota de cierre —se encuentra al terminar de mirar, no se
 * interpone—.
 *
 * El texto se reproduce literal. Lo único que se añade es composición
 * tipográfica: sangría de primera línea (que en el original venían como
 * espacios al principio de cada párrafo), la línea de diálogo separada, y la
 * cita de su obra en cursiva por ser palabras suyas y no de quien lo recuerda.
 */

const PARRAFOS = [
  'Para escribir sobre Amhed Escallón Gamarra, el escritor, no basta con leer “Ojos de rata”, su obra literaria. Hay que escalar sin duda alguna en sus lecturas primigenias, su aguzado sentido del humor y en su robustecida sensación hedonista de haber vivido todo y estar nostálgico por el camino recorrido.',
  'Escallón vivía el arte de la palabra, bebía los néctares ácidos de la intangibilidad, y, por si fuera poco, entendía como ninguno, las fragilidades del ser humano en el continuo desahogo de los sentimientos; un ser humano contratodo; eufemístico, socarrón, inteligente, procaz e incisivo en la frenética vaguedad de convivir con las ansiedades del día a día y correr rápidamente hacia la liturgia de los sueños y quedarse ahí para siempre.',
];

// Este párrafo lleva dentro una cita de su propia obra, después de los dos
// puntos. Se separa para poder componerla en cursiva sin partir la frase.
const PARRAFO_CON_CITA = {
  antes: 'Hoy sigue ahí, quizá sumergido en las borrascosas aguas de las no presencias, pero, tercamente presente con sus letras fragorosas, punzantes y lóbregas: ',
  cita: 'sus ojos brillaban con un brillo de llamas azules y su cuerpo ya no temblaba, era feliz, era por esos cortos minutos tan feliz que sus recuerdos ya no dolían y sintió que dios se reconciliaba al fin con él.',
};

const PARRAFOS_FINALES = [
  'Yo estoy diciendo cosas sobre alguien que escribía magnifico, un conversador insaciable, una persona franca, pero difícil de saber quién era.',
  'Escallón Gamarra, ese bacán de mirada lejana y sensibilidad persistente no estará de acuerdo con los adjetivos utilizados para hablar de él, ni con los epítetos expresados para entender (algo inescrutable) su torrente narrativo.',
  'Hoy no está, pero es complicado hablar de la literatura del Cesar sin contar con “Ojos de rata”, una especie de ópera prima que nos dejó para que sigamos caminando de su mano por los intrincados senderos de la palabra.',
  'En su lacónica biografía cuentan que por ahí queda una novela inédita, “Sino es de noche que hago vivo”. El titulo habla por si solo de su personalidad, de su carrera sórdida por llegar a todas partes y quedarse en el recuerdo de quienes lo conocimos y lo leímos.',
  'Ya no está, pero sus letras perviven en la oquedad de los tiempos y se niegan a morir, así Amhed ya no esté con nosotros.',
];

export default function HomenajeEscallon() {
  const { isDark } = useContext(ThemeContext);

  // La sangría de primera línea es la convención de la prosa en español y
  // sustituye a los espacios manuales del texto original, que el navegador
  // colapsaría de todos modos.
  const parrafo = `text-[15px] sm:text-base leading-[1.85] indent-8 ${
    isDark ? 'text-stone-400' : 'text-stone-700'
  }`;

  return (
    <section
      aria-labelledby="homenaje-titulo"
      // Abre la página, así que el filete va debajo: separa el homenaje de las
      // convocatorias que vienen después, en vez de rematar la página.
      className={`mb-14 pb-12 border-b ${isDark ? 'border-stone-800' : 'border-stone-200'}`}
    >
      {/* Medida de lectura corta a propósito: la prosa larga se lee mal a todo
          el ancho de la rejilla de convocatorias. */}
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          {/* El retrato abre el homenaje: es lo primero que se ve al llegar. */}
          <div className="flex justify-center mb-7">
            <div
              className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-xl ring-1 ring-offset-4 ${
                isDark
                  ? 'ring-amber-500/30 ring-offset-stone-950 shadow-black/40'
                  : 'ring-amber-700/25 ring-offset-stone-50 shadow-stone-400/30'
              }`}
            >
              <img
                src={retratoAmhed}
                alt="Retrato de Amhed Escallón Gamarra"
                // Está al final de la página, siempre por debajo del pliegue:
                // no tiene sentido descargarla antes de que haga falta.
                loading="lazy"
                decoding="async"
                className="absolute max-w-none"
                style={ENCUADRE_RETRATO}
              />
            </div>
          </div>

          <span className={`inline-block text-[10px] font-bold tracking-[0.25em] uppercase mb-4 ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            In memoriam
          </span>

          <h2
            id="homenaje-titulo"
            className={`font-serif font-bold text-3xl sm:text-4xl leading-tight ${
              isDark ? 'text-stone-100' : 'text-stone-900'
            }`}
          >
            Amhed Escallón Gamarra
          </h2>

          <span
            className={`block w-12 h-px mx-auto mt-6 ${isDark ? 'bg-amber-500/40' : 'bg-amber-600/40'}`}
            aria-hidden="true"
          />
        </header>

        <div className="space-y-5">
          {PARRAFOS.map((texto) => (
            <p key={texto.slice(0, 24)} className={parrafo}>{texto}</p>
          ))}

          <p className={parrafo}>
            {PARRAFO_CON_CITA.antes}
            <em className={isDark ? 'text-stone-300' : 'text-stone-800'}>
              {PARRAFO_CON_CITA.cita}
            </em>
          </p>

          <p className={parrafo}>
            Estoy seguro que si estuviera vivo se hubiese molestado conmigo, me hubiera dicho:
          </p>

          {/* El diálogo va en su propia línea, sin sangría y con un aire a la
              izquierda: así se distingue de la prosa que lo rodea. */}
          <p className={`pl-8 font-serif italic text-[15px] sm:text-base leading-relaxed ${
            isDark ? 'text-stone-300' : 'text-stone-800'
          }`}>
            —No me conoces ni así.
          </p>

          <p className={parrafo}>Y tendría mucha razón.</p>

          {PARRAFOS_FINALES.map((texto) => (
            <p key={texto.slice(0, 24)} className={parrafo}>{texto}</p>
          ))}
        </div>

        {/* La dedicatoria cierra alineada a la derecha, como una firma. */}
        <p className={`mt-10 text-right font-serif italic text-lg ${
          isDark ? 'text-amber-400/80' : 'text-[#5D4037]'
        }`}>
          A tu memoria, mi hermano …
        </p>
      </div>
    </section>
  );
}

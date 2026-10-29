import xss from 'xss';

/**
 * Filtro único del contenido con formato (obras y columnas de opinión).
 *
 * Antes cada controlador tenía su propia lista blanca, y por eso el mismo texto
 * pegado se guardaba distinto según el sitio: las columnas descartaban los
 * `<div>` que genera el editor al pulsar Enter (las líneas se pegaban) y la
 * alineación, y las obras conservaban la fuente y el tamaño de Word, que pisan
 * la tipografía del sitio y la fuente para dislexia del lector.
 *
 * Qué se conserva: énfasis (negrita, cursiva, subrayado, tachado, super y
 * subíndice), párrafos y títulos, listas, citas, enlaces, saltos de línea y la
 * ALINEACIÓN y la SANGRÍA de primera línea. Qué no: fuentes, tamaños, colores,
 * márgenes e interlineado. Eso lo decide el sitio, no el documento de origen.
 */

const BLOCK_ATTRS = ['style'];

const BASE_WHITELIST = {
  a: ['href', 'title', 'target', 'rel'],
  b: [],
  strong: [],
  em: [],
  i: [],
  u: [],
  s: [],
  sup: [],
  sub: [],
  p: BLOCK_ATTRS,
  div: BLOCK_ATTRS,
  blockquote: BLOCK_ATTRS,
  h1: BLOCK_ATTRS,
  h2: BLOCK_ATTRS,
  h3: BLOCK_ATTRS,
  h4: BLOCK_ATTRS,
  br: [],
  ul: [],
  ol: [],
  li: [],
  hr: [],
};

// Solo estas dos propiedades sobreviven dentro de `style`. Sin esta lista el
// filtro de CSS de `xss` deja pasar márgenes, fuentes y tamaños.
const CSS_WHITELIST = {
  'text-align': true,
  'text-indent': true,
};

/**
 * Devuelve el HTML limpio, SIN recortarlo: quien lo llama compara su longitud
 * con el máximo y responde con un error claro. Cortar en silencio dejaba el
 * texto a medias (y a veces una etiqueta abierta) sin que nadie se enterara.
 */
export function sanitizeRichHtml(value, { allowImages = false } = {}) {
  if (typeof value !== 'string') return '';

  return xss(value, {
    whiteList: allowImages
      ? { ...BASE_WHITELIST, img: ['src', 'alt', 'title'] }
      : BASE_WHITELIST,
    css: { whiteList: CSS_WHITELIST },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  }).trim();
}

/** El texto sin etiquetas, para validar longitudes mínimas sin contar el marcado. */
export function richTextToPlain(value) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function contentTooLongMessage(maxLength) {
  return `El texto es demasiado largo: el máximo es de ${maxLength.toLocaleString('es-CO')} caracteres contando el formato. Divídelo en partes o quítale formato innecesario.`;
}

/**
 * Limpieza del texto pegado en los editores de obras y columnas.
 *
 * Los editores son un `contentEditable`: sin esto, al pegar desde Word entra
 * tal cual el HTML del portapapeles (clases `Mso*`, fuentes, tamaños en puntos,
 * márgenes, viñetas escritas como texto...), el servidor lo filtra después en
 * silencio y lo publicado no se parece a lo que se vio en el editor. Aquí se
 * traduce ANTES de insertarlo, con las mismas reglas que aplica el servidor
 * (backend/src/utils/richText.js), para que editor y lector coincidan.
 *
 * Se conserva: negrita, cursiva, subrayado, tachado, super/subíndice, títulos,
 * listas (también las que Word dibuja como párrafos con viñeta), citas,
 * enlaces, saltos de línea, alineación y sangría. Se descarta: fuentes,
 * tamaños, colores, márgenes, interlineado, imágenes y todo lo demás.
 */

const SKIP_TAGS = new Set([
  'script', 'style', 'meta', 'link', 'title', 'head', 'xml', 'img', 'svg', 'iframe',
  'object', 'embed', 'noscript', 'template', 'button', 'input', 'select', 'textarea',
]);

const BLOCK_TAGS = new Set([
  'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'table',
  'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'hr', 'section', 'article', 'header',
  'footer', 'aside', 'nav', 'main', 'pre', 'figure', 'figcaption', 'address', 'dl', 'dt', 'dd',
]);

const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

// Con tres espacios o más al empezar un párrafo, quien escribió quería una
// sangría (Word no tiene tecla para ella y mucha gente la hace con la barra
// espaciadora). Se convierte en una sangría real, que el lector sí respeta; los
// espacios en HTML se juntan y la sangría desaparecía.
const MIN_INDENT_SPACES = 3;
const INDENT_CSS = '2em';

// Cuatro o más líneas cortas seguidas son casi seguro un poema o una letra de
// canción: se agrupan en un solo párrafo con saltos de línea para que la
// estrofa se vea junta, no como párrafos sueltos separados entre sí. Con menos
// de cuatro podría ser simplemente prosa con párrafos breves.
const MAX_VERSE_LENGTH = 65;
const MIN_VERSE_LINES = 4;

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const escapeAttribute = (text) => escapeHtml(text).replace(/"/g, '&quot;');

const plainLength = (html) => html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim().length;

/** Espacios al inicio, recortados a un solo espacio entre palabras. */
function tidy(html) {
  return html
    .replace(/\s*<br>\s*/g, '<br>')
    .replace(/^(?:\s|<br>)+/, '')
    .replace(/(?:\s|<br>)+$/, '')
    .replace(/ {2,}/g, ' ');
}

function wrap(tag, inner) {
  return inner.trim() ? `<${tag}>${inner}</${tag}>` : inner;
}

const isListMarker = (node) => /mso-list\s*:\s*ignore/i.test(node.getAttribute?.('style') || '');

function safeHref(value) {
  const href = String(value || '').trim();
  return /^(https?:\/\/|mailto:)/i.test(href) ? href : null;
}

function inlineChildren(node) {
  return Array.from(node.childNodes).map(inlineNode).join('');
}

function inlineNode(node) {
  if (node.nodeType === 3) {
    return escapeHtml(
      node.nodeValue.replace(/[\u200b-\u200d\ufeff]/g, '').replace(/[\s\u00a0]+/g, ' '),
    );
  }

  if (node.nodeType !== 1) return '';

  const tag = node.tagName.toLowerCase();

  if (SKIP_TAGS.has(tag) || isListMarker(node)) return '';
  if (tag === 'br') return '<br>';

  const inner = inlineChildren(node);

  // Un bloque dentro de contenido en línea (un `<p>` en una celda, por
  // ejemplo): se separa con un espacio para que no se peguen las palabras.
  if (BLOCK_TAGS.has(tag)) return `${inner} `;

  if (tag === 'a') {
    const href = safeHref(node.getAttribute('href'));
    return href && inner.trim()
      ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : inner;
  }

  const direct = { b: 'strong', strong: 'strong', i: 'em', em: 'em', u: 'u', ins: 'u', s: 's', strike: 's', del: 's', sup: 'sup', sub: 'sub' }[tag];
  if (direct) return wrap(direct, inner);

  // Word y los navegadores expresan el énfasis con estilos en un `<span>`.
  const style = node.style;
  let result = inner;

  if (style) {
    const weight = style.fontWeight;
    if (weight === 'bold' || weight === 'bolder' || Number(weight) >= 600) result = wrap('strong', result);
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') result = wrap('em', result);

    const decoration = `${style.textDecoration} ${style.textDecorationLine}`;
    if (/underline/.test(decoration)) result = wrap('u', result);
    if (/line-through/.test(decoration)) result = wrap('s', result);
    if (style.verticalAlign === 'super') result = wrap('sup', result);
    if (style.verticalAlign === 'sub') result = wrap('sub', result);
  }

  return result;
}

function alignOf(node) {
  const value = String(node.style?.textAlign || node.getAttribute?.('align') || '').toLowerCase();
  return ALIGNMENTS.has(value) ? value : '';
}

function hasIndent(node) {
  const declared = parseFloat(node.style?.textIndent);
  if (declared > 0) return true;

  // Sin quitar saltos de línea: si el texto empieza por un salto, los espacios
  // que siguen son el sangrado del código fuente de la página, no una sangría.
  return new RegExp(`^[ \\u00a0\\t]{${MIN_INDENT_SPACES},}\\S`).test(node.textContent || '');
}

const isWordListParagraph = (node) => (
  /MsoListParagraph/i.test(node.getAttribute('class') || '')
  || /mso-list\s*:\s*l\d+/i.test(node.getAttribute('style') || '')
);

function wordListKind(node) {
  const marker = node.querySelector('[style*="mso-list" i]');
  const text = (marker?.textContent || '').replace(/[\s\u00a0]+/g, '');
  return /^\(?(\d+|[a-z]|[ivxlcdm]+)[.)]$/i.test(text) ? 'ol' : 'ul';
}

const hasBlockChildren = (node) => Array.from(node.children).some((child) => BLOCK_TAGS.has(child.tagName.toLowerCase()));

function listItems(listNode, kind, blocks) {
  Array.from(listNode.children).forEach((item) => {
    if (item.tagName.toLowerCase() !== 'li') return;

    const nested = [];
    const html = Array.from(item.childNodes).map((child) => {
      const tag = child.nodeType === 1 ? child.tagName.toLowerCase() : '';
      if (tag === 'ul' || tag === 'ol') {
        nested.push([child, tag]);
        return '';
      }
      return inlineNode(child);
    }).join('');

    blocks.push({ type: 'li', kind, html: tidy(html) });
    // Las sublistas se aplanan: el editor solo maneja un nivel.
    nested.forEach(([child, nestedKind]) => listItems(child, nestedKind, blocks));
  });
}

function walkBlocks(parent, blocks) {
  let pending = '';

  const flush = () => {
    const html = tidy(pending);
    if (plainLength(html)) blocks.push({ type: 'p', html });
    pending = '';
  };

  Array.from(parent.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      pending += inlineNode(node);
      return;
    }

    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;

    if (!BLOCK_TAGS.has(tag)) {
      pending += inlineNode(node);
      return;
    }

    flush();

    if (tag === 'ul' || tag === 'ol') {
      listItems(node, tag, blocks);
    } else if (tag === 'hr') {
      blocks.push({ type: 'hr' });
    } else if (tag === 'table') {
      node.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.children)
          .filter((cell) => /^(td|th)$/i.test(cell.tagName))
          .map((cell) => tidy(inlineChildren(cell)))
          .filter(plainLength);
        if (cells.length) blocks.push({ type: 'p', html: cells.join(' | ') });
      });
    } else if (/^h[1-6]$/.test(tag)) {
      // El editor ofrece h2–h4: un h1 (el título del documento) sería más
      // grande que el título de la propia obra.
      const level = Math.min(Math.max(Number(tag[1]), 2), 4);
      blocks.push({ type: `h${level}`, html: tidy(inlineChildren(node)), align: alignOf(node) });
    } else if (tag === 'blockquote') {
      const inner = [];
      walkBlocks(node, inner);
      blocks.push({ type: 'blockquote', html: inner.map((block) => block.html || '').filter(Boolean).join('<br>') });
    } else if (tag === 'p' && isWordListParagraph(node)) {
      blocks.push({ type: 'li', kind: wordListKind(node), html: tidy(inlineChildren(node)) });
    } else if (hasBlockChildren(node) && tag !== 'p') {
      walkBlocks(node, blocks);
    } else {
      blocks.push({ type: 'p', html: tidy(inlineChildren(node)), align: alignOf(node), indent: hasIndent(node) });
    }
  });

  flush();
}

// Un párrafo que ya trae sus versos separados con saltos de línea (como Word
// guarda una estrofa escrita con Mayús+Enter) no debe sangrarse solo en la
// primera línea ni justificarse: se deja alineado a la izquierda.
function normalizeStanzas(blocks) {
  return blocks.map((block) => {
    if (block.type !== 'p' || !block.html.includes('<br>')) return block;

    const lines = block.html.split('<br>');
    const isStanza = lines.length >= 3 && lines.every((line) => plainLength(line) <= MAX_VERSE_LENGTH);
    if (!isStanza) return block;

    const keepsAlignment = block.align === 'center' || block.align === 'right';
    return { ...block, align: keepsAlignment ? block.align : 'left', indent: false };
  });
}

function groupVerses(blocks) {
  const result = [];
  let run = [];

  const flush = () => {
    if (run.length >= MIN_VERSE_LINES) {
      result.push({ type: 'p', html: run.map((block) => block.html).join('<br>'), align: 'left' });
    } else {
      result.push(...run);
    }
    run = [];
  };

  blocks.forEach((block) => {
    const candidate = block.type === 'p'
      && !block.html.includes('<br>')
      && plainLength(block.html) <= MAX_VERSE_LENGTH
      && block.align !== 'center'
      && block.align !== 'right';

    if (candidate) {
      run.push(block);
    } else {
      flush();
      result.push(block);
    }
  });

  flush();
  return result;
}

function styleAttribute({ align, indent }) {
  const parts = [];
  if (align) parts.push(`text-align:${align}`);
  if (indent) parts.push(`text-indent:${INDENT_CSS}`);
  return parts.length ? ` style="${parts.join(';')}"` : '';
}

function serialize(blocks) {
  const out = [];
  let list = null;

  const closeList = () => {
    if (list) {
      out.push(`<${list.kind}>${list.items.join('')}</${list.kind}>`);
      list = null;
    }
  };

  blocks.forEach((block) => {
    if (block.type === 'li') {
      if (!list || list.kind !== block.kind) {
        closeList();
        list = { kind: block.kind, items: [] };
      }
      list.items.push(`<li>${block.html}</li>`);
      return;
    }

    closeList();

    if (block.type === 'hr') out.push('<hr>');
    else if (block.type === 'blockquote') out.push(`<blockquote>${block.html}</blockquote>`);
    else out.push(`<${block.type}${styleAttribute(block)}>${block.html}</${block.type}>`);
  });

  closeList();
  return out.join('');
}

function finish(blocks) {
  const meaningful = blocks.filter((block) => block.type === 'hr' || plainLength(block.html || ''));
  return serialize(groupVerses(normalizeStanzas(meaningful)));
}

/** Del HTML del portapapeles (Word, una página web, otro editor) al HTML limpio del editor. */
export function cleanPastedHtml(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const blocks = [];
  walkBlocks(doc.body, blocks);
  return finish(blocks);
}

/** Texto plano: cada línea no vacía es un párrafo. */
export function plainTextToHtml(text) {
  const blocks = String(text)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      const html = escapeHtml(line.replace(/[\s\u00a0]+/g, ' ').trim());
      return html
        ? { type: 'p', html, indent: new RegExp(`^[ \\u00a0\\t]{${MIN_INDENT_SPACES},}\\S`).test(line) }
        : null;
    })
    .filter(Boolean);

  return finish(blocks);
}

/**
 * Manejador de `onPaste` del `contentEditable`. `onChange` recibe el HTML
 * resultante del editor, para que el estado del formulario quede al día.
 */
export function handleRichPaste(event, onChange) {
  const clipboard = event.clipboardData;
  if (!clipboard) return;

  const html = clipboard.getData('text/html');
  const text = clipboard.getData('text/plain');

  // Una imagen pegada entraría como un `data:` enorme que el servidor no
  // acepta. Si solo hay imagen (sin texto), no hay nada que insertar.
  event.preventDefault();
  if (!html && !text) return;

  const editor = event.currentTarget;
  const cleaned = (html ? cleanPastedHtml(html) : '') || plainTextToHtml(text);
  if (!cleaned) return;

  document.execCommand('insertHTML', false, cleaned);
  onChange?.(editor.innerHTML || '');
}

/**
 * Propiedades para esparcir sobre el `contentEditable`:
 *   <div contentEditable {...richEditorHandlers(setContent)} />
 *
 * Además de limpiar el pegado, hace que Enter cree párrafos `<p>` y no `<div>`
 * (el valor por defecto de Chrome): así lo que se escribe a mano tiene la misma
 * forma que lo que se pega.
 */
export function richEditorHandlers(onChange) {
  return {
    onFocus: () => {
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch {
        // Navegadores sin soporte: Enter seguirá creando `<div>`, que el
        // servidor también admite.
      }
    },
    onPaste: (event) => handleRichPaste(event, onChange),
  };
}

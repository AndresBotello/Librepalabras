import { adminDb } from '../config/firebaseAdmin.js';
import { mergeContestStates, normalizeContestId } from '../config/contests.js';
import { pickPodium, readContestStates } from './contest.service.js';

/**
 * Buscador del sitio.
 *
 * Firestore no sabe buscar texto: solo compara por igualdad o por prefijo de un
 * campo, así que "una palabra que aparezca en el título o en el nombre del
 * autor" no se puede expresar como consulta. La alternativa habitual es un
 * servicio externo (Algolia, Typesense), que para un catálogo de cientos de
 * documentos es más infraestructura que problema resuelto.
 *
 * En su lugar se mantiene un índice plano en memoria —solo los campos que se
 * ven en un resultado— que se reconstruye cada TTL. Buscar es entonces recorrer
 * un arreglo: no cuesta ni una lectura de Firestore, y el coste real (leer las
 * colecciones) se paga una vez cada TTL en lugar de una vez por tecla pulsada.
 *
 * Tres decisiones que son de seguridad, no de rendimiento:
 *
 * 1. Lo que el visitante escribe NUNCA entra en una consulta ni en una expresión
 *    regular: se normaliza a términos y se compara con `includes`. No hay nada
 *    que inyectar, ni un patrón que pueda hacerse exponencial (ReDoS).
 * 2. El índice solo incluye lo que ya es público —obra aprobada, columna
 *    publicada, edición publicada— y solo copia los campos que salen en la
 *    respuesta. Un borrador o un correo de contacto no pueden filtrarse por
 *    aquí porque no llegan a entrar.
 * 3. La URL de cada resultado la arma este archivo con una plantilla fija a
 *    partir del id del documento. Nada de lo guardado en la base de datos se usa
 *    como destino, así que no hay forma de colar un `javascript:` ni una
 *    redirección a otro dominio.
 */

// Cinco minutos: lo que puede tardar en aparecer en el buscador algo recién
// publicado. A cambio, mil visitantes buscando cuestan las mismas lecturas que
// uno solo.
const INDEX_TTL = 5 * 60 * 1000;

// Si Firestore falla se sigue sirviendo el índice anterior y se reintenta
// pronto, pero no en cada petición: eso convertiría una caída de la base de
// datos en una tormenta de reintentos.
const RETRY_AFTER_ERROR = 30 * 1000;

const MIN_TERM_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;
const MAX_TERMS = 6;
const MAX_RESULTS = 8;
const MAX_TITLE = 140;
const MAX_EXCERPT = 160;

/**
 * Palabras que no distinguen nada. Se descartan de la consulta porque los
 * términos se exigen TODOS: sin esto, buscar "el quijote" no encontraría "Don
 * Quijote". Solo se descartan si queda algo más que buscar.
 */
const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
  'y', 'o', 'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'lo', 'es',
]);

let cache = { entries: [], builtAt: 0 };
let building = null;

/**
 * Misma forma para el texto guardado y para lo que se teclea: sin tildes, sin
 * mayúsculas. Así "poesia" encuentra "Poesía" y "nino" encuentra "niño".
 */
function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * El ÚNICO tokenizador: lo usan por igual el índice y lo que se teclea. Que
 * ambos lados partan el texto con la misma regla es lo que hace que la
 * comparación sea predecible en vez de una acumulación de casos raros.
 */
function tokenize(value) {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Texto listo para comparar: las palabras separadas por un espacio y con un
 * espacio también en los extremos. Así `includes(' ' + termino)` significa
 * exactamente "hay una palabra que empieza por ahí", sin construir ninguna
 * expresión regular con lo que escribió el visitante.
 *
 * Sin esto la búsqueda sería por subcadena y "nada" encontraría "dominada".
 */
function toHaystack(value) {
  const tokens = tokenize(value);
  return tokens.length ? ` ${tokens.join(' ')} ` : '';
}

/** Las columnas guardan HTML; en un resultado solo cabe texto plano. */
function toPlainText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(value) {
  const text = toPlainText(value);
  return text.length > MAX_EXCERPT ? `${text.slice(0, MAX_EXCERPT).trimEnd()}…` : text;
}

/**
 * Cada fuente declara qué colección lee, qué filtra y qué campos pide.
 *
 * `fields` no es una optimización menor: una obra guarda el texto completo en
 * `content` y una columna su HTML entero. Pedir el documento tal cual movería
 * megabytes en cada reconstrucción para quedarse con el título.
 */
const SOURCES = [
  {
    type: 'obra',
    label: 'Obras',
    collection: 'literature',
    filter: ['status', '==', 'approved'],
    fields: ['title', 'author', 'genre', 'tags', 'description', 'cover'],
    toEntry: (id, data) => ({
      title: data.title,
      subtitle: excerpt(data.description),
      author: data.author,
      image: data.cover,
      keywords: [data.genre, ...(Array.isArray(data.tags) ? data.tags : [])],
      url: `/stories?obra=${encodeURIComponent(id)}`,
    }),
  },
  {
    type: 'columna',
    label: 'Columnas de opinión',
    collection: 'opinionColumns',
    filter: ['status', '==', 'published'],
    fields: ['title', 'subtitle', 'author', 'slug', 'coverUrl'],
    toEntry: (id, data) => ({
      title: data.title,
      subtitle: excerpt(data.subtitle),
      author: data.author,
      image: data.coverUrl,
      keywords: [],
      // Sin slug la ficha no se puede abrir por su ruta bonita, pero el detalle
      // acepta también el id, así que el resultado sigue llevando a alguna parte.
      url: `/columnas/${encodeURIComponent(data.slug || id)}`,
    }),
  },
  {
    type: 'autor',
    label: 'Autores',
    collection: 'authors',
    filter: null,
    fields: ['name', 'bio', 'description', 'photoURL'],
    toEntry: (id, data) => ({
      title: data.name,
      subtitle: excerpt(data.bio || data.description),
      author: '',
      image: data.photoURL,
      keywords: [],
      url: `/authors?autor=${encodeURIComponent(id)}`,
    }),
  },
  {
    type: 'poliversia',
    label: 'Poliversia',
    collection: 'poliversiaEditions',
    filter: ['isPublished', '==', true],
    fields: ['title', 'edition', 'description', 'coverUrl'],
    toEntry: (id, data) => ({
      title: data.title,
      subtitle: excerpt(data.description),
      author: Number.isFinite(data.edition) ? `Edición ${data.edition}` : '',
      image: data.coverUrl,
      keywords: ['revista', 'poliversia'],
      url: `/poleversia?edicion=${encodeURIComponent(id)}`,
    }),
  },
];

/**
 * Los cuentos de concurso se arman en `readContestEntries`, pero comparten el
 * mismo tipo y etiqueta por defecto que el resto de fuentes.
 */
const CONTEST_SOURCE = { type: 'concurso', label: 'Concursos' };

/**
 * Una entrada separa lo que se devuelve (`result`) de lo que solo sirve para
 * puntuar (`haystack`). No es cosmético: garantiza que ningún campo del
 * documento pueda acabar en la respuesta por descuido al añadir una fuente.
 */
function toIndexEntry(source, id, raw) {
  const title = toPlainText(raw.title).slice(0, MAX_TITLE);

  // Sin título no hay nada que enseñar en la lista de resultados.
  if (!title) return null;

  const author = toPlainText(raw.author).slice(0, MAX_TITLE);
  const keywords = (raw.keywords || []).filter(Boolean).join(' ');

  return {
    result: {
      id: `${source.type}:${id}`,
      type: source.type,
      // La etiqueta es la de la fuente salvo que la entrada pida otra: un cuento
      // de concurso premiado se anuncia como «Ganadores», no como «Concursos».
      label: raw.label || source.label,
      title,
      subtitle: raw.subtitle || '',
      author,
      // Las portadas son de Cloudinary; exigir https corta de raíz que una URL
      // rara guardada en el documento acabe como `src` de una imagen.
      image: typeof raw.image === 'string' && raw.image.startsWith('https://') ? raw.image : null,
      url: raw.url,
    },
    haystack: {
      title: toHaystack(title),
      author: toHaystack(author),
      keywords: toHaystack(keywords),
      text: toHaystack(raw.subtitle),
    },
  };
}

async function readSource(source) {
  let query = adminDb.collection(source.collection);

  if (source.filter) {
    query = query.where(...source.filter);
  }

  const snapshot = await query.select(...source.fields).get();

  return snapshot.docs
    .map((doc) => toIndexEntry(source, doc.id, source.toEntry(doc.id, doc.data())))
    .filter(Boolean);
}

/**
 * Los cuentos de concurso publicados, con el podio marcado.
 *
 * Esta fuente no cabe en la tabla de arriba porque una entrada no se puede
 * construir mirando solo su documento: si un cuento es ganador depende de cómo
 * quedó frente a los demás de su certamen, y a qué página lleva depende del
 * `slug` del concurso, que vive en el catálogo y no en el cuento.
 *
 * Dos cosas que no se deciden aquí:
 *
 * - Qué es público: `isPublished`, el mismo filtro de la página de Concursos.
 *   Un cuento en evaluación no entra al índice, así que el buscador no puede
 *   adelantar el fallo del jurado ni enseñar un texto inédito.
 * - Quién ganó: lo dice `pickPodium`, la misma función que responde la página
 *   de Ganadores.
 *
 * La consulta se hace aquí en vez de reutilizar `listPublishedStories()` para
 * poder proyectar los campos: esa función trae el documento entero, y el texto
 * completo de cada cuento no pinta nada en un índice de títulos.
 */
async function readContestEntries() {
  const [catalog, snapshot] = await Promise.all([
    readContestStates().then(mergeContestStates),
    adminDb
      .collection('contestStories')
      .where('isPublished', '==', true)
      .select('title', 'authorName', 'contestId', 'imageUrl', 'averageScore', 'totalRatings')
      .get(),
  ]);

  const stories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const entries = [];

  for (const contest of catalog) {
    // Un certamen «próximamente» no enseña sus cuentos: su página dice que
    // aparecerán cuando se abra la convocatoria. Indexarlos igual convertiría el
    // buscador en la puerta de atrás de una lista que el sitio decide ocultar.
    if (contest.status === 'proximamente') continue;

    const own = stories.filter((story) => normalizeContestId(story.contestId) === contest.id);

    // El podio solo existe cuando la edición ya cerró: mientras el certamen
    // sigue vivo no hay ganadores que anunciar, aunque ya haya notas puestas.
    const podium = contest.status === 'cerrado' ? pickPodium(own) : [];
    const positionByStory = new Map(podium.map((story, index) => [story.id, index + 1]));

    for (const story of own) {
      const position = positionByStory.get(story.id);
      const edition = contest.edition ? ` ${contest.edition}` : '';

      entries.push(toIndexEntry(CONTEST_SOURCE, story.id, {
        title: story.title,
        subtitle: position
          ? `${position}.º puesto · ${contest.name}${edition}`
          : `${contest.name}${edition}`,
        author: story.authorName,
        image: story.imageUrl,
        label: position ? 'Ganadores' : 'Concursos',
        keywords: ['concurso', contest.shortName, position ? 'ganador premio podio' : ''],
        url: `/concursos/${encodeURIComponent(contest.slug)}?cuento=${encodeURIComponent(story.id)}`,
      }));
    }
  }

  return entries.filter(Boolean);
}

async function rebuildIndex() {
  try {
    const groups = await Promise.all([...SOURCES.map(readSource), readContestEntries()]);
    cache = { entries: groups.flat(), builtAt: Date.now() };
  } catch (error) {
    console.error('No se pudo reconstruir el índice de búsqueda:', error.message);
    // Se conserva lo que hubiera y se adelanta el reloj para reintentar en
    // RETRY_AFTER_ERROR en vez de esperar un TTL completo.
    cache = { entries: cache.entries, builtAt: Date.now() - INDEX_TTL + RETRY_AFTER_ERROR };
  }

  return cache.entries;
}

/**
 * Si llegan diez búsquedas con el índice caducado, solo la primera lee
 * Firestore: las demás esperan a esa misma promesa.
 */
function getIndex() {
  if (!adminDb) return Promise.resolve([]);

  if (Date.now() - cache.builtAt < INDEX_TTL) {
    return Promise.resolve(cache.entries);
  }

  if (!building) {
    building = rebuildIndex().finally(() => {
      building = null;
    });
  }

  return building;
}

/**
 * De lo que se teclea a una lista corta de términos.
 *
 * Express entrega un arreglo cuando el parámetro se repite (`?q=a&q=b`) y un
 * objeto con la sintaxis `?q[x]=1`. Aquí solo se acepta texto: cualquier otra
 * forma se trata como búsqueda vacía en lugar de reventar más abajo.
 */
export function parseQuery(value) {
  if (typeof value !== 'string') return [];

  const terms = tokenize(value.slice(0, MAX_QUERY_LENGTH))
    .filter((term) => term.length >= MIN_TERM_LENGTH);

  const unique = [...new Set(terms)];
  const meaningful = unique.filter((term) => !STOPWORDS.has(term));

  return (meaningful.length ? meaningful : unique).slice(0, MAX_TERMS);
}

/**
 * Cuánto vale que un término aparezca, según dónde aparezca. El título manda:
 * quien busca "poliversia" espera la revista antes que una obra que la
 * menciona de pasada en su reseña.
 *
 * El término solo cuenta si empieza una palabra, pero no tiene que completarla:
 * quien va por "poes" ya debe estar viendo la poesía en la lista.
 */
function scoreTerm(haystack, term) {
  const needle = ` ${term}`;

  if (haystack.title === `${needle} `) return 120;
  if (haystack.title.startsWith(needle)) return 80;
  if (haystack.title.includes(needle)) return 40;
  if (haystack.author.includes(needle)) return 20;
  if (haystack.keywords.includes(needle)) return 12;
  if (haystack.text.includes(needle)) return 6;

  return 0;
}

export async function searchSite(rawQuery) {
  const terms = parseQuery(rawQuery);

  if (terms.length === 0) return [];

  const entries = await getIndex();
  const matches = [];

  for (const entry of entries) {
    let score = 0;

    // Se exigen todos los términos: "cuento breve" debe encontrar lo que es a
    // la vez cuento y breve, no todo lo que sea una cosa o la otra.
    for (const term of terms) {
      const termScore = scoreTerm(entry.haystack, term);

      if (termScore === 0) {
        score = 0;
        break;
      }

      score += termScore;
    }

    if (score > 0) {
      matches.push({ score, result: entry.result });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title, 'es'))
    .slice(0, MAX_RESULTS)
    .map((match) => match.result);
}

import { adminDb } from '../config/firebaseAdmin.js';
import { createTtlCache } from '../utils/ttlCache.js';

// Cola de moderación: un TTL corto por estado; se vacía junto con la caché de
// aprobadas en cualquier escritura sobre obras.
const WORKS_BY_STATUS_TTL_MS = 15 * 1000;
const byStatusCaches = new Map();

/**
 * Caché en memoria de las obras aprobadas de la biblioteca general.
 *
 * Firestore cobra una lectura por documento devuelto. La biblioteca, la ficha
 * de autores y el panel leían TODAS las obras aprobadas en cada visita, así que
 * el coste crecía con (obras × visitas). Aquí se paga una vez cada TTL, o una
 * vez tras cada cambio, y todas las visitas intermedias salen de memoria.
 *
 * Dos garantías que importan:
 *
 * - Cualquier escritura sobre una obra llama a `invalidateApprovedWorks()`
 *   (crear, aprobar, editar, borrar, comentar, calificar, dar me gusta...), de
 *   modo que quien escribe y recarga ve su cambio al instante. El TTL solo cubre
 *   lo que no pasa por aquí (otra instancia del servidor, ediciones manuales en
 *   Firestore) y los contadores de vistas, que no invalidan a propósito.
 * - Una lectura que estaba en vuelo cuando se invalidó no puede reponer datos
 *   viejos: se descarta (ver `version`).
 *
 * Las obras de sección (`section`) no entran: se sirven por su propia página y
 * ni la biblioteca ni las fichas de autor las cuentan.
 */

const CACHE_TTL_MS = 60 * 1000;

let cached = null; // { works, loadedAt }
let inFlight = null;
let version = 0;

export async function getWorksByStatusCached(status) {
  if (!byStatusCaches.has(status)) {
    byStatusCaches.set(status, createTtlCache(WORKS_BY_STATUS_TTL_MS));
  }

  const works = await byStatusCaches.get(status).get(async () => {
    const snapshot = await adminDb.collection('literature').where('status', '==', status).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  // Copias: quien llama ordena y recorta, y no debe tocar lo compartido.
  return works.map((work) => ({ ...work }));
}

export function invalidateApprovedWorks() {
  byStatusCaches.forEach((cache) => cache.invalidate());
  version += 1;
  cached = null;
  inFlight = null;
}

async function loadApprovedWorks() {
  const snapshot = await adminDb.collection('literature').where('status', '==', 'approved').get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((work) => !work.section)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Todas las obras aprobadas de la biblioteca, de la más reciente a la más
 * antigua. El arreglo es compartido: quien lo use debe tratarlo como solo
 * lectura (filtrar y cortar con `.filter`/`.slice` está bien; ordenar o mutar
 * sobre él, no).
 */
export async function getApprovedWorksCached() {
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.works;
  }

  // Las peticiones simultáneas con la caché vacía comparten una sola consulta.
  if (!inFlight) {
    const startedAt = version;

    const pending = loadApprovedWorks()
      .then((works) => {
        if (startedAt === version) {
          cached = { works, loadedAt: Date.now() };
        }
        return works;
      })
      .finally(() => {
        if (inFlight === pending) {
          inFlight = null;
        }
      });

    inFlight = pending;
  }

  return inFlight;
}

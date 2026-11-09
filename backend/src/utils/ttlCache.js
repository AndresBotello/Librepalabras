/**
 * Caché en memoria con TTL para lecturas de Firestore que se repiten mucho y
 * cambian poco. Sirve el valor guardado hasta que vence o se invalida, y
 * comparte una sola consulta entre peticiones simultáneas. Una lectura que
 * estaba en vuelo cuando se invalidó no repone datos viejos (ver `version`).
 */
export function createTtlCache(ttlMs) {
  let entry = null; // { value, loadedAt }
  let inFlight = null;
  let version = 0;

  return {
    async get(loader) {
      if (entry && Date.now() - entry.loadedAt < ttlMs) {
        return entry.value;
      }

      if (!inFlight) {
        const startedAt = version;
        const pending = loader()
          .then((value) => {
            if (startedAt === version) {
              entry = { value, loadedAt: Date.now() };
            }
            return value;
          })
          .finally(() => {
            if (inFlight === pending) inFlight = null;
          });
        inFlight = pending;
      }

      return inFlight;
    },
    invalidate() {
      version += 1;
      entry = null;
      inFlight = null;
    },
  };
}

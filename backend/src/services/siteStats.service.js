import { adminDb } from '../config/firebaseAdmin.js';

// El número se muestra en la portada, que visita cualquiera: contarlo en cada
// visita sería pagar lecturas de Firestore por un dato que cambia pocas veces al
// día. Se guarda en memoria unos minutos.
// Un registro nuevo la invalida al instante (ver `invalidateRegisteredUsersCount`);
// el vencimiento cubre los demás casos (borrar o desactivar cuentas, otra
// instancia del servidor).
const CACHE_TTL_MS = 60 * 1000;

let cached = null; // { total, updatedAt }
let inFlight = null;

/**
 * Descarta la cifra guardada para que la siguiente petición la recuente. Se
 * llama cuando se crea una cuenta. Conserva el valor viejo como respaldo por si
 * la nueva consulta falla.
 */
export function invalidateRegisteredUsersCount() {
  if (cached) {
    cached.updatedAt = 0;
  }
}

async function countRegisteredUsers() {
  const users = adminDb.collection('users');

  // Agregaciones de Firestore: devuelven solo el número, no descargan ningún
  // documento. Las cuentas desactivadas no cuentan; se resta en vez de filtrar
  // por `disabled == false` porque los perfiles antiguos no tienen el campo y
  // ese filtro los dejaría fuera.
  const [all, disabled] = await Promise.all([
    users.count().get(),
    users.where('disabled', '==', true).count().get(),
  ]);

  return Math.max(0, all.data().count - disabled.data().count);
}

/**
 * Total de usuarios registrados. Solo devuelve el número: nunca ningún dato de
 * las cuentas.
 *
 * Las peticiones simultáneas con la caché vencida comparten una sola consulta, y
 * si Firestore falla se sirve el último valor conocido antes que un error: una
 * cifra de portada ligeramente vieja no le importa a nadie.
 */
export async function getRegisteredUsersCount() {
  if (!adminDb) {
    return null;
  }

  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    return cached.total;
  }

  if (!inFlight) {
    inFlight = countRegisteredUsers()
      .then((total) => {
        cached = { total, updatedAt: Date.now() };
        return total;
      })
      .catch((error) => {
        console.error('No se pudo contar los usuarios registrados:', error.message);
        return cached ? cached.total : null;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

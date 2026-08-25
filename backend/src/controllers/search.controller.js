import { searchSite } from '../services/search.service.js';

/**
 * `GET /api/search?q=...&tipo=...`
 *
 * Es pública a propósito: el buscador de la portada lo usa cualquier visitante,
 * y todo lo que devuelve ya se puede ver navegando el sitio. La validación de
 * `q` vive entera en el servicio (ver `parseQuery`), así que aquí no hace falta
 * comprobar nada: si llega basura, la búsqueda sale vacía.
 *
 * `tipo` es opcional y solo sirve para pedir un grupo completo (la página de
 * resultados, al abrir "ver todos" de un tipo): un valor que no coincide con
 * ningún tipo real simplemente no encuentra nada, así que tampoco hace falta
 * validarlo contra una lista.
 */
export async function searchContent(req, res) {
  try {
    const type = typeof req.query.tipo === 'string' ? req.query.tipo.trim() : '';
    const { results, counts, total, approximate } = await searchSite(req.query.q, { type: type || undefined });

    // `total` y `counts` cuentan todas las coincidencias, no solo las que caben
    // en `results`: son lo que el desplegable enseña junto a cada grupo.
    return res.json({ ok: true, results, counts, total, approximate });
  } catch (error) {
    // El detalle se queda en los logs. Un mensaje de error de Firestore en la
    // respuesta describiría la estructura interna a quien esté probando cosas.
    console.error('Error en la búsqueda del sitio:', error);

    return res.status(500).json({ ok: false, message: 'No se pudo completar la búsqueda' });
  }
}

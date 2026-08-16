import { searchSite } from '../services/search.service.js';

/**
 * `GET /api/search?q=...`
 *
 * Es pública a propósito: el buscador de la portada lo usa cualquier visitante,
 * y todo lo que devuelve ya se puede ver navegando el sitio. La validación de
 * `q` vive entera en el servicio (ver `parseQuery`), así que aquí no hace falta
 * comprobar nada: si llega basura, la búsqueda sale vacía.
 */
export async function searchContent(req, res) {
  try {
    const results = await searchSite(req.query.q);

    return res.json({ ok: true, results, total: results.length });
  } catch (error) {
    // El detalle se queda en los logs. Un mensaje de error de Firestore en la
    // respuesta describiría la estructura interna a quien esté probando cosas.
    console.error('Error en la búsqueda del sitio:', error);

    return res.status(500).json({ ok: false, message: 'No se pudo completar la búsqueda' });
  }
}

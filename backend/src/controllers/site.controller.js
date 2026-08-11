import { adminDb } from '../config/firebaseAdmin.js';
import {
  getHomeContent,
  getSettings,
  updateHomeContent,
  updateSettings,
} from '../services/siteConfig.service.js';

/**
 * Configuración pública. La consume el frontend antes de pintar nada, así que
 * solo viaja lo que la interfaz necesita: el resto de ajustes (moderación
 * automática, límites) es información de operación y se queda en el panel.
 */
export async function getPublicConfig(_req, res) {
  try {
    const settings = await getSettings();

    return res.json({
      ok: true,
      config: {
        siteTitle: settings.siteTitle,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        maxUploadMb: settings.maxUploadMb,
        allowRegistrations: settings.allowRegistrations,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener la configuración',
      error: error.message,
    });
  }
}

/**
 * Contenido de la portada, con las obras destacadas ya resueltas.
 *
 * Se piden por id con `getAll`, que es una sola ida y vuelta para todas, y se
 * descarta cualquiera que ya no esté aprobada: una obra destacada que después
 * se rechaza no puede seguir apareciendo en la portada.
 */
export async function getHome(_req, res) {
  try {
    const content = await getHomeContent();
    const featuredWorks = await resolveFeaturedWorks(content.featuredWorkIds);

    return res.json({
      ok: true,
      home: {
        ...content,
        featuredWorks,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el contenido de la portada',
      error: error.message,
    });
  }
}

async function resolveFeaturedWorks(ids = []) {
  if (!adminDb || !Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const refs = ids.map((id) => adminDb.collection('literature').doc(id));
  const snapshots = await adminDb.getAll(...refs);

  return snapshots
    .filter((snapshot) => snapshot.exists && snapshot.data().status === 'approved')
    .map((snapshot) => {
      const data = snapshot.data();

      return {
        id: snapshot.id,
        title: data.title || 'Sin título',
        author: data.author || 'Anónimo',
        authorId: data.authorId || '',
        genre: data.genre || '',
        description: data.description || '',
        cover: data.cover || null,
        averageRating: data.averageRating || 0,
        totalRatings: data.totalRatings || 0,
        views: data.views || 0,
      };
    })
    // `getAll` no garantiza el orden de entrada; se restaura el que eligió el
    // admin para que arrastrar y soltar en el panel signifique algo.
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export async function getAdminSettings(_req, res) {
  try {
    const settings = await getSettings();

    return res.json({ ok: true, settings });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener los ajustes',
      error: error.message,
    });
  }
}

export async function patchSettings(req, res) {
  try {
    const settings = await updateSettings(req.body, req.auth?.uid);

    return res.json({
      ok: true,
      message: 'Ajustes guardados correctamente',
      settings,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al guardar los ajustes',
    });
  }
}

export async function patchHome(req, res) {
  try {
    const content = await updateHomeContent(req.body, req.auth?.uid);
    const featuredWorks = await resolveFeaturedWorks(content.featuredWorkIds);

    return res.json({
      ok: true,
      message: 'Portada actualizada correctamente',
      home: { ...content, featuredWorks },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al guardar la portada',
    });
  }
}

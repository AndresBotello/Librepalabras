import { FieldValue } from 'firebase-admin/firestore';
import xss from 'xss';
import { adminDb } from '../config/firebaseAdmin.js';
import { SECTIONS, getSection } from '../config/sections.js';
import { contentTooLongMessage, richTextToPlain, sanitizeRichHtml } from '../utils/richText.js';
import { purgeWorkStats, recordWorkEvent } from '../services/workAnalytics.service.js';
import { deleteFile } from '../services/upload.service.js';
import { cloudinaryPublicId } from '../utils/files.js';
import { notifyWorkReviewed } from './literature.controller.js';
import { createCommentThread } from './commentThread.js';

const MAX_TITLE_LENGTH = 150;
const MAX_NAME_LENGTH = 120;
const MAX_CHILD_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 20000;
const EXCERPT_LENGTH = 220;
const MAX_MUNICIPALITY_LENGTH = 80;
const MAX_CONTENT_LENGTH = 500000;
const MIN_TEXT_LENGTH = 20;
const MIN_CHILD_AGE = 3;
const MAX_CHILD_AGE = 17;
const MAX_PAGE_SIZE = 100;

// Las imágenes se suben por /upload/cover, que las deja en Cloudinary. Aceptar
// cualquier URL permitiría incrustar en la portada de una sección una imagen
// alojada donde su dueño quiera (y que puede cambiar después).
const ALLOWED_IMAGE_HOST = 'res.cloudinary.com';

function isTrustedImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === ALLOWED_IMAGE_HOST;
  } catch {
    return false;
  }
}

/** Texto de una sola línea, sin etiquetas, recortado y listo para guardar. */
function cleanLine(value) {
  return xss(String(value ?? ''), { whiteList: {}, stripIgnoreTag: true })
    .replace(/\s+/g, ' ')
    .trim();
}

function fail(res, status, message) {
  return res.status(status).json({ ok: false, message });
}

/**
 * Lo que sale a la calle de una obra de sección. Lista blanca y no "la obra
 * menos lo secreto": así un campo nuevo en el documento no queda público sin
 * que nadie lo decida. Quedan fuera el correo y el uid de quien la subió, los
 * hashes de IP de los "me gusta" y los comentarios.
 */
function toPublicWork(id, data, { withContent = false } = {}) {
  return {
    id,
    section: data.section,
    kind: data.kind,
    title: data.title,
    author: data.author,
    // La descripción es texto con formato (HTML saneado). En la lista basta un
    // resumen sin etiquetas; la completa solo viaja al abrir la obra.
    excerpt: richTextToPlain(data.description).slice(0, EXCERPT_LENGTH),
    cover: data.cover || null,
    createdAt: data.createdAt,
    views: data.views || 0,
    // Solo existen en la sección que los usa.
    ...(data.childAge ? { childAge: data.childAge } : {}),
    ...(data.municipality ? { municipality: data.municipality } : {}),
    ...(withContent ? { content: data.content || '', description: data.description || '' } : {}),
  };
}

/**
 * Valida y normaliza el cuerpo de una obra de sección. Devuelve el error ya
 * redactado para el usuario o los campos limpios; nada de lo que llega del
 * cliente se guarda sin pasar por aquí.
 */
function parseSubmission(section, body) {
  const kind = section.kinds.find((item) => item.value === body.kind);

  if (!kind) {
    return { error: `Tipo inválido. Válidos: ${section.kinds.map((item) => item.value).join(', ')}` };
  }

  const title = cleanLine(body.title);

  if (title.length < 2 || title.length > MAX_TITLE_LENGTH) {
    return { error: `El título debe tener entre 2 y ${MAX_TITLE_LENGTH} caracteres` };
  }

  const content = sanitizeRichHtml(body.content);

  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: contentTooLongMessage(MAX_CONTENT_LENGTH) };
  }

  const cover = body.cover || null;

  if (cover && !isTrustedImageUrl(cover)) {
    return { error: 'La imagen no es válida: súbela desde el formulario' };
  }

  // Un dibujo es su imagen; el texto es opcional. Cualquier otro tipo es texto.
  if (kind.imageRequired) {
    if (!cover) return { error: 'Sube la imagen del dibujo' };
  } else if (richTextToPlain(content).length < MIN_TEXT_LENGTH) {
    return { error: `El texto debe tener al menos ${MIN_TEXT_LENGTH} caracteres` };
  }

  // Con formato, igual que el texto: lo que se pega de Word se conserva.
  const description = sanitizeRichHtml(body.description);

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: contentTooLongMessage(MAX_DESCRIPTION_LENGTH) };
  }

  return {
    fields: { kind: kind.value, genre: kind.genre, title, content, cover, description },
  };
}

/**
 * Datos propios de cada sección. Los niños se identifican solo por el nombre de
 * pila y la edad, y no se publica nada sin que conste la autorización del
 * acudiente: son menores y el admin sube su obra en su nombre.
 */
function parseSectionFields(section, body, user, existing = null) {
  if (section.value === 'ninos') {
    const childName = cleanLine(body.childName);
    const childAge = Number(body.childAge);

    if (childName.length < 2 || childName.length > MAX_CHILD_NAME_LENGTH) {
      return { error: `El nombre del niño o niña debe tener entre 2 y ${MAX_CHILD_NAME_LENGTH} caracteres` };
    }

    if (!Number.isInteger(childAge) || childAge < MIN_CHILD_AGE || childAge > MAX_CHILD_AGE) {
      return { error: `La edad debe ser un número entre ${MIN_CHILD_AGE} y ${MAX_CHILD_AGE}` };
    }

    // Al editar, la autorización ya registrada vale: no se vuelve a pedir.
    if (body.guardianConsent !== true && existing?.guardianConsent !== true) {
      return { error: 'Confirma que el acudiente autorizó la publicación' };
    }

    return { fields: { author: childName, childAge, guardianConsent: true } };
  }

  // Palabras sin dueños: la firma es libre —un seudónimo, "Anónimo"— y, vacía,
  // se firma con el nombre de la cuenta. `authorId` sigue siendo quien la sube.
  const typedAuthor = cleanLine(body.author);

  if (typedAuthor && (typedAuthor.length < 2 || typedAuthor.length > MAX_NAME_LENGTH)) {
    return { error: `La firma debe tener entre 2 y ${MAX_NAME_LENGTH} caracteres` };
  }

  const municipality = cleanLine(body.municipality);

  if (municipality.length > MAX_MUNICIPALITY_LENGTH) {
    return { error: `El municipio no puede pasar de ${MAX_MUNICIPALITY_LENGTH} caracteres` };
  }

  return {
    fields: {
      // Al editar, una firma vacía conserva la que ya tenía: si no, un admin
      // que corrige la obra de un colaborador la firmaría con su propio nombre.
      author: typedAuthor || existing?.author || user?.name || user?.nombres || 'Anónimo',
      municipality,
    },
  };
}

export async function createSectionWork(req, res) {
  try {
    const section = getSection(req.params.section);

    if (!section) {
      return fail(res, 404, 'Sección no encontrada');
    }

    const role = req.user?.role;

    if (!section.uploadRoles.includes(role)) {
      return fail(res, 403, 'No tienes permiso para publicar en esta sección');
    }

    const submission = parseSubmission(section, req.body);
    if (submission.error) return fail(res, 400, submission.error);

    const specific = parseSectionFields(section, req.body, req.user);
    if (specific.error) return fail(res, 400, specific.error);

    // El admin no se revisa a sí mismo; lo de un colaborador sí pasa por la
    // misma cola de moderación que el resto de las obras.
    const isAdmin = role === 'admin';
    const now = new Date().toISOString();

    // Lleva todos los campos de una obra normal para que el análisis, las
    // cuentas borradas y los "me gusta" funcionen sin enterarse de que existe
    // una sección.
    const work = {
      ...submission.fields,
      ...specific.fields,
      section: section.value,
      scope: 'regional',
      type: 'free',
      price: null,
      pdfUrl: null,
      tags: [],
      status: isAdmin ? 'approved' : 'pending_review',
      authorId: req.auth.uid,
      authorProfileId: null,
      authorEmail: req.user?.email || '',
      authoredByOther: true,
      createdAt: now,
      updatedAt: now,
      views: 0,
      downloads: 0,
      ratings: [],
      comments: [],
      averageRating: 0,
      totalRatings: 0,
      totalComments: 0,
      likesCount: 0,
      likedByUsers: [],
      likedByIpHashes: [],
    };

    const docRef = await adminDb.collection('literature').add(work);

    if (isAdmin) {
      await notifyWorkReviewed({ ...work, id: docRef.id }, 'approved');
    }

    return res.status(201).json({
      ok: true,
      message: isAdmin ? 'Publicado' : 'Enviado para revisión',
      workId: docRef.id,
    });
  } catch (error) {
    console.error('Error al crear obra de sección:', error);
    return fail(res, 500, 'Error al publicar');
  }
}

export async function getSectionWorks(req, res) {
  try {
    const section = getSection(req.params.section);

    if (!section) {
      return fail(res, 404, 'Sección no encontrada');
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, MAX_PAGE_SIZE);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const kind = String(req.query.kind || '');

    // Dos igualdades: no necesita índice compuesto. El orden y el filtro por
    // tipo van en memoria, como en la biblioteca general.
    const snapshot = await adminDb
      .collection('literature')
      .where('section', '==', section.value)
      .where('status', '==', 'approved')
      .get();

    const works = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((work) => !kind || work.kind === kind)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      ok: true,
      works: works.slice(offset, offset + limit).map((work) => toPublicWork(work.id, work)),
      total: works.length,
    });
  } catch (error) {
    console.error('Error al listar obras de sección:', error);
    return fail(res, 500, 'Error al obtener las obras');
  }
}

export async function getSectionWork(req, res) {
  try {
    const section = getSection(req.params.section);

    if (!section) {
      return fail(res, 404, 'Sección no encontrada');
    }

    const doc = await adminDb.collection('literature').doc(req.params.id).get();
    const data = doc.data();

    // Misma respuesta para "no existe", "es de otra sección" y "aún no está
    // aprobada": no se revela qué hay detrás de un id que no se puede leer.
    if (!doc.exists || data.section !== section.value || data.status !== 'approved') {
      return fail(res, 404, 'Obra no encontrada');
    }

    await doc.ref.update({ views: FieldValue.increment(1) });
    recordWorkEvent(doc.id, { views: 1 });

    return res.json({
      ok: true,
      work: toPublicWork(doc.id, { ...data, views: (data.views || 0) + 1 }, { withContent: true }),
    });
  } catch (error) {
    console.error('Error al obtener obra de sección:', error);
    return fail(res, 500, 'Error al obtener la obra');
  }
}

/**
 * Todo lo de una sección, en cualquier estado, para la pantalla de gestión del
 * admin. A diferencia de la lista pública, incluye lo pendiente y lo rechazado.
 */
export async function getSectionWorksForAdmin(req, res) {
  try {
    const section = getSection(req.query.section);

    if (!section) {
      return fail(res, 400, 'Indica una sección válida');
    }

    const snapshot = await adminDb
      .collection('literature')
      .where('section', '==', section.value)
      .get();

    const works = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        return {
          ...toPublicWork(doc.id, data),
          status: data.status,
          authorEmail: data.authorEmail || '',
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ ok: true, works });
  } catch (error) {
    console.error('Error al listar la sección para el admin:', error);
    return fail(res, 500, 'Error al obtener las obras');
  }
}

/**
 * Borra una obra de sección. Es una ruta propia y no `DELETE /literature/:id`
 * porque esa solo deja borrar al dueño (`authorId`), y aquí el admin tiene que
 * poder retirar también lo que subió un colaborador. Exige además que la obra
 * pertenezca a la sección de la URL, para que no sirva de atajo para borrar una
 * obra de la biblioteca general.
 */
export async function deleteSectionWork(req, res) {
  try {
    const section = getSection(req.params.section);

    if (!section) {
      return fail(res, 404, 'Sección no encontrada');
    }

    const docRef = adminDb.collection('literature').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().section !== section.value) {
      return fail(res, 404, 'Obra no encontrada');
    }

    const work = doc.data();

    // `recursiveDelete` también borra la subcolección de comentarios: borrar solo
    // el documento los dejaría huérfanos.
    await adminDb.recursiveDelete(docRef);
    await purgeWorkStats(doc.id);

    // La imagen se limpia después y sin que su suerte afecte a la respuesta: la
    // obra ya no existe. Lo peor que puede quedar es un archivo huérfano.
    const publicId = cloudinaryPublicId(work.cover);

    if (publicId) {
      try {
        await deleteFile(publicId);
      } catch (error) {
        console.error(`No se pudo borrar ${publicId} de Cloudinary:`, error.message);
      }
    }

    return res.json({ ok: true, message: 'Obra eliminada' });
  } catch (error) {
    console.error('Error al eliminar obra de sección:', error);
    return fail(res, 500, 'Error al eliminar la obra');
  }
}

/**
 * Quién puede tocar una obra de sección: un rol que publique en ella y, si no es
 * admin, solo si la subió él. Devuelve la obra o responde el error y devuelve
 * `null`. Un id que no es de esa sección se trata como inexistente.
 */
async function loadManageableWork(req, res) {
  const section = getSection(req.params.section);

  if (!section) {
    fail(res, 404, 'Sección no encontrada');
    return null;
  }

  const role = req.user?.role;

  if (!section.uploadRoles.includes(role)) {
    fail(res, 403, 'No tienes permiso para editar en esta sección');
    return null;
  }

  const docRef = adminDb.collection('literature').doc(req.params.id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().section !== section.value) {
    fail(res, 404, 'Obra no encontrada');
    return null;
  }

  if (role !== 'admin' && doc.data().authorId !== req.auth.uid) {
    fail(res, 403, 'Solo puedes editar tus propias obras');
    return null;
  }

  return { section, docRef, work: doc.data(), id: doc.id };
}

/** La obra completa, tal como se guardó, para llenar el formulario de edición. */
export async function getSectionWorkForEdit(req, res) {
  try {
    const found = await loadManageableWork(req, res);
    if (!found) return undefined;

    const { work, id } = found;

    return res.json({
      ok: true,
      work: {
        ...toPublicWork(id, work, { withContent: true }),
        status: work.status,
        guardianConsent: work.guardianConsent === true,
      },
    });
  } catch (error) {
    console.error('Error al abrir obra de sección para editar:', error);
    return fail(res, 500, 'Error al obtener la obra');
  }
}

export async function updateSectionWork(req, res) {
  try {
    const found = await loadManageableWork(req, res);
    if (!found) return undefined;

    const { section, docRef, work } = found;

    const submission = parseSubmission(section, req.body);
    if (submission.error) return fail(res, 400, submission.error);

    const specific = parseSectionFields(section, req.body, req.user, work);
    if (specific.error) return fail(res, 400, specific.error);

    const isAdmin = req.user.role === 'admin';

    await docRef.update({
      ...submission.fields,
      ...specific.fields,
      // Lo que corrige un colaborador vuelve a revisión: si no, una obra ya
      // aprobada podría cambiar por completo sin que nadie la vuelva a ver. El
      // admin no se revisa a sí mismo y conserva el estado.
      ...(isAdmin ? {} : { status: 'pending_review' }),
      updatedAt: new Date().toISOString(),
    });

    // Si se cambió la imagen, la anterior queda huérfana en Cloudinary.
    if (work.cover && work.cover !== submission.fields.cover) {
      const publicId = cloudinaryPublicId(work.cover);

      if (publicId) {
        try {
          await deleteFile(publicId);
        } catch (error) {
          console.error(`No se pudo borrar ${publicId} de Cloudinary:`, error.message);
        }
      }
    }

    return res.json({
      ok: true,
      message: isAdmin ? 'Cambios guardados' : 'Cambios enviados para revisión',
    });
  } catch (error) {
    console.error('Error al editar obra de sección:', error);
    return fail(res, 500, 'Error al guardar los cambios');
  }
}

/**
 * Comentarios de las obras de sección, con la misma lógica que los de las
 * columnas de opinión (`commentThread.js`): comentan usuarios y visitantes con
 * captcha, y los modera el admin, el dueño de la obra o el autor del comentario.
 * Solo se ven y se comentan las obras aprobadas de una sección que los admita.
 */
const commentThread = createCommentThread({
  async load(req) {
    const section = getSection(req.params.section);

    if (!section?.interactions) return null;

    const ref = adminDb.collection('literature').doc(req.params.id);
    const doc = await ref.get();

    // Un id de otra sección (o de la biblioteca general) se trata como inexistente.
    if (!doc.exists || doc.data().section !== section.value) return null;

    return { ref, data: { id: doc.id, ...doc.data() } };
  },

  // Lo pendiente o rechazado solo lo ve el admin (que lo está revisando) y quien
  // lo subió.
  canRead(work, req) {
    if (work.status === 'approved') return true;
    if (req.user?.role === 'admin') return true;
    return Boolean(req.auth?.uid) && work.authorId === req.auth.uid;
  },

  canWrite: (work) => work.status === 'approved',
  isOwner: (work, uid) => work.authorId === uid,
  notFound: 'Obra no encontrada',
  label: 'la obra de sección',
});

export const getSectionWorkComments = commentThread.list;
export const addSectionWorkComment = commentThread.add;
export const deleteSectionWorkComment = commentThread.remove;

export function getSections(_req, res) {
  return res.json({
    ok: true,
    sections: SECTIONS.map(({ uploadRoles: _roles, ...section }) => section),
  });
}

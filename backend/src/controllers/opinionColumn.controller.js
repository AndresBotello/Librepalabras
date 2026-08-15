import xss from 'xss';
import { adminDb } from '../config/firebaseAdmin.js';

const VALID_STATUSES = ['draft', 'pending_review', 'changes_requested', 'published', 'rejected'];
const REVIEW_STATUSES = ['published', 'rejected', 'changes_requested'];
const MAX_TITLE_LENGTH = 180;
const MAX_SUBTITLE_LENGTH = 320;
const MAX_AUTHOR_LENGTH = 140;
const MAX_CONTENT_LENGTH = 60000;

function sanitizeText(value, maxLength) {
  if (value === undefined || value === null) {
    return '';
  }

  const text = String(value).trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function sanitizeCoverUrl(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function sanitizeHtmlContent(value) {
  if (typeof value !== 'string') return '';

  const allowed = xss(value, {
    whiteList: {
      a: ['href', 'title', 'target', 'rel'],
      b: [],
      strong: [],
      em: [],
      i: [],
      u: [],
      p: [],
      br: [],
      ul: [],
      ol: [],
      li: [],
      blockquote: [],
      h2: [],
      h3: [],
      h4: [],
      span: ['style'],
      img: ['src', 'alt', 'title'],
      hr: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });

  return allowed.trim().slice(0, MAX_CONTENT_LENGTH);
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSlug(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'columna';
}

async function ensureUniqueSlug(title, currentId = null) {
  const base = buildSlug(title);
  let slug = base;
  let counter = 2;

  while (true) {
    const snapshot = await adminDb.collection('opinionColumns').where('slug', '==', slug).get();
    const exists = snapshot.docs.some((doc) => doc.id !== currentId);
    if (!exists) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

function buildAuditEntry(action, user, note = '') {
  return {
    action,
    actorId: user?.uid || null,
    actorName: user?.name || user?.nombres || user?.email || 'Sistema',
    actorRole: user?.role || 'user',
    note: sanitizeText(note, 700),
    createdAt: new Date().toISOString(),
  };
}

function normalizedStatus(status, isAdmin = false) {
  if (!status || !VALID_STATUSES.includes(status)) {
    return 'draft';
  }

  if (!isAdmin && ['published', 'rejected', 'changes_requested'].includes(status)) {
    return 'draft';
  }

  return status;
}

function baseColumnPayload(user, raw, createdAt) {
  const title = sanitizeText(raw.title, MAX_TITLE_LENGTH);
  const subtitle = sanitizeText(raw.subtitle, MAX_SUBTITLE_LENGTH);
  const author = sanitizeText(raw.author || user?.name || user?.nombres || 'Anónimo', MAX_AUTHOR_LENGTH);
  const content = sanitizeHtmlContent(raw.content);

  const status = normalizedStatus(raw.status, user?.role === 'admin');
  const now = createdAt || new Date().toISOString();

  const column = {
    title,
    subtitle,
    author,
    content,
    coverUrl: sanitizeCoverUrl(raw.coverUrl),
    slug: raw.slug || buildSlug(title),
    status,
    createdBy: user?.uid || null,
    updatedBy: user?.uid || null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    reviewNotes: '',
    reviewHistory: status === 'pending_review' || status === 'published' || status === 'rejected' || status === 'changes_requested'
      ? [buildAuditEntry(status === 'pending_review' ? 'enviado_a_revision' : status === 'published' ? 'publicada' : status === 'rejected' ? 'rechazada' : 'solicitud_de_cambios', user, raw.reviewNotes || '')]
      : [],
  };

  if (status === 'published') {
    column.publishedAt = now;
  }

  return column;
}

export async function getOpinionColumns(req, res) {
  try {
    const { status, view } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const isPublicView = view === 'public' || (!req.auth && !req.user);

    let query = adminDb.collection('opinionColumns');

    if (isPublicView) {
      query = query.where('status', '==', 'published');
    } else if (!isAdmin) {
      query = query.where('createdBy', '==', req.auth.uid);
    } else if (status && VALID_STATUSES.includes(status)) {
      query = query.where('status', '==', status);
    }

    if (status && VALID_STATUSES.includes(status) && !isPublicView && isAdmin) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const columns = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return { id: doc.id, ...data, slug: data.slug || buildSlug(data.title || '') };
      })
      .sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt || 0) - new Date(a.publishedAt || a.updatedAt || a.createdAt || 0));

    return res.json({ ok: true, columns, total: columns.length });
  } catch (error) {
    console.error('Error al listar columnas de opinión:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener columnas de opinión' });
  }
}

export async function getMyOpinionColumns(req, res) {
  try {
    const { status } = req.query;
    let query = adminDb.collection('opinionColumns').where('createdBy', '==', req.auth.uid);

    if (status && VALID_STATUSES.includes(status)) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const columns = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    return res.json({ ok: true, columns, total: columns.length });
  } catch (error) {
    console.error('Error al listar columnas del usuario:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener tus columnas' });
  }
}

export async function getOpinionColumnById(req, res) {
  try {
    const { id } = req.params;
    let doc = await adminDb.collection('opinionColumns').doc(id).get();

    if (!doc.exists) {
      const directMatch = await adminDb.collection('opinionColumns').where('slug', '==', id).limit(1).get();
      if (!directMatch.empty) {
        doc = directMatch.docs[0];
      } else {
        const fallbackSnapshot = await adminDb.collection('opinionColumns').get();
        const fallbackDoc = fallbackSnapshot.docs.find((item) => {
          const data = item.data();
          return item.id === id || buildSlug(data.title || '') === id;
        });

        if (!fallbackDoc) {
          return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
        }

        doc = fallbackDoc;
      }
    }

    const column = { id: doc.id, ...doc.data(), slug: doc.data().slug || buildSlug(doc.data().title || '') };
    const isOwner = column.createdBy === req.auth?.uid;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && !isOwner && column.status !== 'published') {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para ver esta columna' });
    }

    return res.json({ ok: true, column });
  } catch (error) {
    console.error('Error al obtener la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener la columna' });
  }
}

export async function createOpinionColumn(req, res) {
  try {
    const { title, subtitle, author, content, coverUrl, status, publishedAt } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ ok: false, message: 'El título es obligatorio' });
    }

    if (!content || !stripHtml(content).length) {
      return res.status(400).json({ ok: false, message: 'El contenido es obligatorio' });
    }

    const cleanedTitle = sanitizeText(title, MAX_TITLE_LENGTH);
    if (!cleanedTitle) {
      return res.status(400).json({ ok: false, message: 'El título no puede quedar vacío' });
    }

    if (stripHtml(content).length < 80) {
      return res.status(400).json({ ok: false, message: 'El contenido debe tener al menos 80 caracteres' });
    }

    const input = {
      title: cleanedTitle,
      subtitle: sanitizeText(subtitle, MAX_SUBTITLE_LENGTH),
      author: sanitizeText(author || req.user?.name || req.user?.nombres || 'Anónimo', MAX_AUTHOR_LENGTH),
      content,
      coverUrl,
      status,
      reviewNotes: '',
    };

    const payload = baseColumnPayload(req.user, input, new Date().toISOString());
    payload.slug = await ensureUniqueSlug(payload.title, null);
    payload.status = normalizedStatus(status, req.user?.role === 'admin');

    if (req.user?.role !== 'admin' && ['published', 'rejected', 'changes_requested'].includes(payload.status)) {
      return res.status(403).json({ ok: false, message: 'Solo un administrador puede publicar o rechazar una columna' });
    }

    const publishedAtValue = publishedAt ? new Date(publishedAt).toISOString() : null;
    if (publishedAt && Number.isNaN(new Date(publishedAt).getTime())) {
      return res.status(400).json({ ok: false, message: 'La fecha de publicación no es válida' });
    }

    if (publishedAtValue && payload.status === 'published') {
      payload.publishedAt = publishedAtValue;
    }

    if (payload.status === 'pending_review') {
      payload.reviewHistory.push(buildAuditEntry('enviado_a_revision', req.user, 'Columna enviada para revisión editorial.'));
    }

    const docRef = await adminDb.collection('opinionColumns').add(payload);
    return res.status(201).json({ ok: true, message: 'Columna creada correctamente', id: docRef.id, column: { id: docRef.id, ...payload } });
  } catch (error) {
    console.error('Error al crear la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al crear la columna' });
  }
}

export async function updateOpinionColumn(req, res) {
  try {
    const { id } = req.params;
    const doc = await adminDb.collection('opinionColumns').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
    }

    const existing = { id: doc.id, ...doc.data() };
    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.createdBy === req.auth.uid;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para editar esta columna' });
    }

    const { title, subtitle, author, content, coverUrl, status, reviewNotes, publishedAt } = req.body;
    const updates = {
      updatedAt: new Date().toISOString(),
      updatedBy: req.auth.uid,
    };

    if (title !== undefined) {
      const cleanTitle = sanitizeText(title, MAX_TITLE_LENGTH);
      if (!cleanTitle) {
        return res.status(400).json({ ok: false, message: 'El título no puede quedar vacío' });
      }
      updates.title = cleanTitle;
    }

    if (subtitle !== undefined) updates.subtitle = sanitizeText(subtitle, MAX_SUBTITLE_LENGTH);
    if (author !== undefined) updates.author = sanitizeText(author, MAX_AUTHOR_LENGTH);
    if (content !== undefined) {
      const sanitizedContent = sanitizeHtmlContent(content);
      if (!stripHtml(sanitizedContent).length) {
        return res.status(400).json({ ok: false, message: 'El contenido es obligatorio' });
      }
      updates.content = sanitizedContent;
    }

    if (coverUrl !== undefined) {
      const sanitizedCover = sanitizeCoverUrl(coverUrl);
      updates.coverUrl = sanitizedCover;
    }

    if (title !== undefined) {
      updates.slug = await ensureUniqueSlug(cleanTitle, id);
    }

    if (status !== undefined) {
      const nextStatus = normalizedStatus(status, isAdmin);
      if (!isAdmin && ['published', 'rejected', 'changes_requested'].includes(nextStatus)) {
        return res.status(403).json({ ok: false, message: 'Solo un administrador puede publicar o rechazar una columna' });
      }
      updates.status = nextStatus;
      if (nextStatus === 'published') {
        updates.publishedAt = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString();
      }
      if (nextStatus === 'draft' || nextStatus === 'pending_review') {
        updates.publishedAt = null;
      }
      if (nextStatus === 'rejected' || nextStatus === 'changes_requested') {
        updates.reviewNotes = sanitizeText(reviewNotes || existing.reviewNotes || '', 700);
      }
    }

    if (reviewNotes !== undefined && isAdmin) {
      updates.reviewNotes = sanitizeText(reviewNotes, 700);
    }

    if (publishedAt !== undefined && (status === 'published' || existing.status === 'published')) {
      const parsedPublishedAt = new Date(publishedAt);
      if (Number.isNaN(parsedPublishedAt.getTime())) {
        return res.status(400).json({ ok: false, message: 'La fecha de publicación no es válida' });
      }
      updates.publishedAt = parsedPublishedAt.toISOString();
    }

    if (existing.status !== updates.status && updates.status !== undefined) {
      const actionMap = {
        draft: 'guardado_como_borrador',
        pending_review: 'enviado_a_revision',
        published: 'publicada',
        rejected: 'rechazada',
        changes_requested: 'solicitud_de_cambios',
      };
      const nextHistory = Array.isArray(existing.reviewHistory) ? [...existing.reviewHistory] : [];
      nextHistory.push(buildAuditEntry(actionMap[updates.status] || 'actualizacion', req.user, reviewNotes || updates.reviewNotes || ''));
      updates.reviewHistory = nextHistory;
    }

    await adminDb.collection('opinionColumns').doc(id).update(updates);

    const updated = { id, ...existing, ...updates };
    return res.json({ ok: true, message: 'Columna actualizada correctamente', column: updated });
  } catch (error) {
    console.error('Error al actualizar la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al actualizar la columna' });
  }
}

export async function reviewOpinionColumn(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, message: 'Estado de revisión no válido' });
    }

    const doc = await adminDb.collection('opinionColumns').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
    }

    const existing = { id: doc.id, ...doc.data() };
    const now = new Date().toISOString();
    const noteText = sanitizeText(notes || '', 700);
    const nextStatus = status === 'published' ? 'published' : status;
    const reviewHistory = Array.isArray(existing.reviewHistory) ? [...existing.reviewHistory] : [];

    reviewHistory.push(buildAuditEntry(
      nextStatus === 'published' ? 'aprobada' : nextStatus === 'rejected' ? 'rechazada' : 'solicitud_de_cambios',
      req.user,
      noteText || (nextStatus === 'published' ? 'Aprobada por el equipo editorial.' : nextStatus === 'rejected' ? 'Rechazada por el equipo editorial.' : 'Se solicita ajustar la columna.')
    ));

    const updates = {
      status: nextStatus,
      reviewNotes: noteText,
      updatedAt: now,
      updatedBy: req.auth.uid,
      reviewedBy: req.auth.uid,
      reviewedAt: now,
      reviewHistory,
      publishedAt: nextStatus === 'published' ? existing.publishedAt || now : existing.publishedAt || null,
    };

    await adminDb.collection('opinionColumns').doc(id).update(updates);

    return res.json({ ok: true, message: nextStatus === 'published' ? 'Columna publicada' : nextStatus === 'rejected' ? 'Columna rechazada' : 'Se solicitaron cambios', column: { id, ...existing, ...updates } });
  } catch (error) {
    console.error('Error al revisar la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al revisar la columna' });
  }
}

export async function deleteOpinionColumn(req, res) {
  try {
    const { id } = req.params;
    const doc = await adminDb.collection('opinionColumns').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
    }

    const existing = { id: doc.id, ...doc.data() };
    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.createdBy === req.auth.uid;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para eliminar esta columna' });
    }

    await adminDb.collection('opinionColumns').doc(id).delete();
    return res.json({ ok: true, message: 'Columna eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar la columna' });
  }
}

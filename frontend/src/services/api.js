const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
      // Las respuestas dependen de la sesión, pero el caché del navegador
      // solo distingue por URL: sin esto puede servir los datos de otro usuario.
      cache: 'no-store',
      ...options,
    });
  } catch (error) {
    // Cancelar una petición no es un fallo: quien la canceló (el buscador, al
    // escribir la siguiente letra) necesita distinguirlo para no pintar un
    // error que no ha ocurrido.
    if (error?.name === 'AbortError') throw error;

    // fetch solo lanza por fallos de red, no por códigos de error HTTP.
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet.', { cause: error });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  return data;
}

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function formatBytes(bytes) {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/**
 * `fetch` no expone el progreso de subida, así que para archivos grandes usamos
 * XHR: es la única forma de tener una barra de progreso real y no un spinner
 * indeterminado durante toda la subida.
 */
function uploadWithProgress(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.ok) {
        resolve(data);
      } else {
        reject(new Error(data?.message || `Error HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('No se pudo conectar con el servidor durante la subida.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Subida cancelada.'));
    });

    xhr.send(formData);
  });
}

export async function uploadCover(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${baseUrl}/upload/cover`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Error HTTP ${response.status}`);
    }

    return data || {};
  } catch (error) {
    throw new Error(`Error al subir portada: ${error.message}`);
  }
}

export async function uploadProfilePhoto(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${baseUrl}/upload/profile-photo`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Error HTTP ${response.status}`);
    }

    return data.url;
  } catch (error) {
    throw new Error(`Error al subir foto de perfil: ${error.message}`);
  }
}

export async function uploadPdf(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${baseUrl}/upload/pdf`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Error HTTP ${response.status}`);
    }

    return data.url;
  } catch (error) {
    throw new Error(`Error al subir PDF: ${error.message}`);
  }
}

export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createSession(payload) {
  return request('/auth/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logoutSession() {
  return request('/auth/logout', {
    method: 'POST',
  });
}

export function getCurrentSession() {
  return request('/auth/me');
}

export function createStory(payload) {
  return request('/stories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Literature endpoints
export function createLiteraryWork(payload) {
  return request('/literature', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateLiteraryWork(id, payload) {
  return request(`/literature/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteLiteraryWork(id) {
  return request(`/literature/${id}`, {
    method: 'DELETE',
  });
}

/**
 * `limit` sube hasta 100 (tope del backend). La respuesta trae además `total`
 * con el número real de obras, que puede ser mayor que las devueltas.
 */
export function getApprovedWorks(genre = '', { limit } = {}) {
  const params = new URLSearchParams();
  if (genre) params.set('genre', genre);
  if (limit) params.set('limit', String(limit));

  const query = params.toString();
  return request(query ? `/literature/approved?${query}` : '/literature/approved');
}

export function getWorkById(id) {
  return request(`/literature/${id}`);
}

export function getMyWorks() {
  return request('/literature/user/my-works');
}

export function getPublishedOpinionColumns() {
  return request('/opinion-columns?view=public');
}

export function getOpinionColumns(status = '') {
  const resolvedStatus = typeof status === 'object' && status ? status.status : status;
  const query = resolvedStatus && resolvedStatus !== 'all' ? `?status=${encodeURIComponent(resolvedStatus)}` : '';
  return request(`/opinion-columns${query}`);
}

export function getMyOpinionColumns(status = '') {
  const resolvedStatus = typeof status === 'object' && status ? status.status : status;
  const query = resolvedStatus && resolvedStatus !== 'all' ? `?status=${encodeURIComponent(resolvedStatus)}` : '';
  return request(`/opinion-columns/mine${query}`);
}

export function getOpinionColumnById(id) {
  return request(`/opinion-columns/${id}`);
}

export function createOpinionColumn(payload) {
  return request('/opinion-columns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateOpinionColumn(id, payload) {
  return request(`/opinion-columns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function reviewOpinionColumn(id, status, notes = '') {
  return request(`/opinion-columns/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

export function deleteOpinionColumn(id) {
  return request(`/opinion-columns/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Obras de la bandeja de moderación. Sin argumento devuelve las pendientes,
 * que es lo que espera el contador del dashboard; con `status` sirve también
 * las ya aprobadas o rechazadas.
 */
export function getPendingWorks(status = 'pending_review', { limit } = {}) {
  const params = new URLSearchParams({ status });
  if (limit) params.set('limit', String(limit));

  return request(`/literature/admin/works?${params.toString()}`);
}

export function reviewWork(id, status, reason = '') {
  return request(`/literature/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
}

export function getGenres() {
  return request('/literature/genres');
}

export function addRating(workId, score) {
  return request(`/literature/${workId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export function addComment(workId, text) {
  return request(`/literature/${workId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function deleteComment(workId, commentId) {
  return request(`/literature/${workId}/comment/${commentId}`, {
    method: 'DELETE',
  });
}

export function getAllUsers() {
  return request('/admin/users');
}

export function getUserById(uid) {
  return request(`/admin/users/${uid}`);
}

export function updateUserById(uid, userData) {
  return request('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(userData),
  });
}

export function updateUserRole(uid, role) {
  return request(`/admin/users/${uid}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function updateUserStatus(uid, disabled) {
  return request(`/admin/users/${uid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ disabled }),
  });
}

export function toggleCommentLike(workId, commentId) {
  return request(`/literature/${workId}/comment/${commentId}/like`, {
    method: 'POST',
  });
}

export function toggleWorkLike(workId) {
  return request(`/literature/${workId}/like`, {
    method: 'POST',
  });
}

// ============================================================
// Catálogo de autores
// ============================================================

/**
 * El catálogo que arma el administrador. Antes esta lista se deducía de quién
 * había subido obra (`/literature/authors/all`); ahora son fichas propias, así
 * que hay autores sin cuenta y colaboradores que publican sin estar en la lista.
 */
export function getAllAuthors() {
  return request('/authors');
}

export function getAuthorById(id) {
  return request(`/authors/${id}`);
}

export function createAuthor(payload) {
  return request('/authors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAuthor(id, payload) {
  return request(`/authors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAuthor(id) {
  return request(`/authors/${id}`, { method: 'DELETE' });
}

// Promotional Books
export function createPromotionalBook(bookData) {
  return request('/promotional-books', {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export function getPromotionalBooks(genre = 'all') {
  const url = genre && genre !== 'all' ? `/promotional-books?genre=${genre}` : '/promotional-books';
  return request(url);
}

export function getPromotionalBookById(id) {
  return request(`/promotional-books/${id}`);
}

export function updatePromotionalBook(id, bookData) {
  return request(`/promotional-books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(bookData),
  });
}

export function deletePromotionalBook(id) {
  return request(`/promotional-books/${id}`, {
    method: 'DELETE',
  });
}

export function toggleBookFavorite(bookId) {
  return request(`/promotional-books/${bookId}/favorite`, {
    method: 'POST',
  });
}

/**
 * Buscador del sitio. La `signal` permite cancelar la petición anterior cuando
 * el visitante sigue escribiendo: sin ella, respuestas lentas podrían llegar
 * desordenadas y pintar resultados de una búsqueda ya abandonada.
 */
export function searchContent(query, { signal, type } = {}) {
  const params = new URLSearchParams({ q: query });
  if (type) params.set('tipo', type);

  return request(`/search?${params.toString()}`, { signal });
}

// Revista Poliversia
export function getPoliversiaEditions({ includeDrafts = false } = {}) {
  return request(includeDrafts ? '/poliversia?includeDrafts=true' : '/poliversia');
}

export function getPoliversiaEdition(id) {
  return request(`/poliversia/${id}`);
}

export function createPoliversiaEdition(payload) {
  return request('/poliversia', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePoliversiaEdition(id, payload) {
  return request(`/poliversia/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deletePoliversiaEdition(id) {
  return request(`/poliversia/${id}`, {
    method: 'DELETE',
  });
}

export function uploadMagazinePdf(file, onProgress) {
  return uploadWithProgress('/upload/magazine-pdf', file, onProgress);
}

export function uploadCoverWithProgress(file, onProgress) {
  return uploadWithProgress('/upload/cover', file, onProgress);
}

// ============================================================
// Grupo Focal Alfredo Correa De Andreís
// ============================================================

/**
 * Los dos modos de encuentro, tal como se guardan en Firestore. Son datos, no
 * texto: los nombres que ve el público ("Cátedra" y "Tertulia") viven en
 * `config/focusGroup.js`, indexados por estos mismos valores.
 */
export const FOCUS_GROUP_TYPES = {
  SYNC: 'sincronico',
  ASYNC: 'asincronico',
};

export function getFocusGroupSessions({ includeDrafts = false } = {}) {
  return request(includeDrafts ? '/focus-group?includeDrafts=true' : '/focus-group');
}

/** Devuelve el encuentro junto con su conversación. */
export function getFocusGroupSession(id) {
  return request(`/focus-group/${id}`);
}

export function createFocusGroupSession(payload) {
  return request('/focus-group', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFocusGroupSession(id, payload) {
  return request(`/focus-group/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteFocusGroupSession(id) {
  return request(`/focus-group/${id}`, { method: 'DELETE' });
}

export function addFocusGroupComment(id, text) {
  return request(`/focus-group/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function deleteFocusGroupComment(id, commentId) {
  return request(`/focus-group/${id}/comments/${commentId}`, { method: 'DELETE' });
}

export function toggleFocusGroupCommentLike(id, commentId) {
  return request(`/focus-group/${id}/comments/${commentId}/like`, { method: 'POST' });
}

/** Confirma o retira la asistencia a una cátedra. Alterna en cada llamada. */
export function toggleFocusGroupAttendance(id) {
  return request(`/focus-group/${id}/rsvp`, { method: 'POST' });
}

/** Solo admin: quién confirmó asistencia a una cátedra. */
export function getFocusGroupAttendees(id) {
  return request(`/focus-group/${id}/attendees`);
}

// Concursos
export const CONTEST_MIN_SCORE = 0;
export const CONTEST_MAX_SCORE = 5;

export const CONTEST_STATUS_LABELS = {
  enviado: 'Enviado',
  en_evaluacion: 'En evaluación',
  calificado: 'Calificado',
  publicado: 'Publicado',
};

/** Catálogo con el estado (abierto / próximamente / cerrado) que fijó el admin. */
export function getContestCatalog() {
  return request('/contest/catalog');
}

/** Solo admin: cuántos cuentos lleva cada convocatoria, por edición. */
export function getContestStats() {
  return request('/contest/stats');
}

/** Solo admin: abre, anuncia o cierra una convocatoria, y puede renombrarla. */
export function setContestState(id, { status, edition, name }) {
  return request(`/contest/catalog/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, edition, name }),
  });
}

export function getPublishedContestStories(contestId = '') {
  return request(contestId ? `/contest/published?contest=${encodeURIComponent(contestId)}` : '/contest/published');
}

export function getPublishedContestStory(id) {
  return request(`/contest/published/${id}`);
}

/** Podios de las ediciones cerradas, calculados por el backend. */
export function getContestWinners() {
  return request('/contest/winners');
}

/** Las inscripciones del colaborador: una por concurso. */
export function getMyContestStories() {
  return request('/contest/mine');
}

export function submitContestStory(payload) {
  return request('/contest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMyContestStory(id, payload) {
  return request(`/contest/mine/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getContestPanel() {
  return request('/contest/panel');
}

export function rateContestStory(id, { score, comment }) {
  return request(`/contest/${id}/rating`, {
    method: 'POST',
    body: JSON.stringify({ score, comment }),
  });
}

export function setContestStoryPublication(id, isPublished) {
  return request(`/contest/${id}/publication`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublished }),
  });
}

export function setContestStoryEvaluation(id, evaluationClosed) {
  return request(`/contest/${id}/evaluation`, {
    method: 'PATCH',
    body: JSON.stringify({ evaluationClosed }),
  });
}

export function deleteContestStory(id) {
  return request(`/contest/${id}`, {
    method: 'DELETE',
  });
}

// Admin - PDF Files
export function getPdfFiles(search = '', sortBy = 'date', limit = 25, offset = 0) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (sortBy) params.append('sortBy', sortBy);
  params.append('limit', limit);
  params.append('offset', offset);
  return request(`/admin/files?${params.toString()}`);
}

export function deletePdfFile(id) {
  return request(`/admin/files/${id}`, {
    method: 'DELETE',
  });
}
// ============================================================
// Notificaciones
// ============================================================

export function getNotifications() {
  return request('/notifications');
}

export function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'POST' });
}

export function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: 'POST' });
}

/** Solo admin: redacta un aviso manual para toda la plataforma. */
export function createAnnouncement(payload) {
  return request('/notifications/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getNotificationHistory(limit = 60) {
  return request(`/notifications/admin/all?limit=${limit}`);
}

export function deleteNotification(id) {
  return request(`/notifications/admin/${id}`, { method: 'DELETE' });
}

// ============================================================
// Configuración del sitio y portada
// ============================================================

export function getSiteConfig() {
  return request('/site/config');
}

export function getHomeContent() {
  return request('/site/home');
}

export function getAdminSettings() {
  return request('/site/admin/settings');
}

export function updateAdminSettings(payload) {
  return request('/site/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateHomeContent(payload) {
  return request('/site/admin/home', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ============================================================
// Moderación de comentarios
// ============================================================

export const REPORT_REASON_LABELS = {
  spam: 'Spam o publicidad',
  ofensivo: 'Lenguaje ofensivo',
  acoso: 'Acoso a una persona',
  desinformacion: 'Información falsa',
  otro: 'Otro motivo',
};

export function reportComment(workId, commentId, reason) {
  return request(`/literature/${workId}/comment/${commentId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function getCommentReports(status = 'pending') {
  return request(`/admin/comment-reports?status=${status}`);
}

export function getCommentReportsCount() {
  return request('/admin/comment-reports/count');
}

/** `action`: 'dismiss' deja el comentario, 'remove' lo elimina. */
export function resolveCommentReport(id, action) {
  return request(`/admin/comment-reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

// ============================================================
// Invitaciones
// ============================================================

export function getInvitations(status = 'all') {
  return request(`/admin/invitations?status=${status}`);
}

export function createInvitation(email, role) {
  return request('/admin/invitations', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export function revokeInvitation(id) {
  return request(`/admin/invitations/${id}`, { method: 'DELETE' });
}

/** Público: valida el token del enlace antes de mostrar el formulario. */
export function getInvitationByToken(token) {
  return request(`/invitations/${encodeURIComponent(token)}`);
}

// ============================================================
// Estado del sistema
// ============================================================

export function getSystemHealth() {
  return request('/admin/health');
}

export function clearErrorLogs() {
  return request('/admin/health/errors', { method: 'DELETE' });
}

export function deleteOrphanFile(publicId, resourceType) {
  return request('/admin/health/orphans/delete', {
    method: 'POST',
    body: JSON.stringify({ publicId, resourceType }),
  });
}

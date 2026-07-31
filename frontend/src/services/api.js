const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}`);
  }

  return data;
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

    return data.url;
  } catch (error) {
    throw new Error(`Error al subir portada: ${error.message}`);
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

export function getApprovedWorks(genre = '') {
  const url = genre ? `/literature/approved?genre=${genre}` : '/literature/approved';
  return request(url);
}

export function getWorkById(id) {
  return request(`/literature/${id}`);
}

export function getMyWorks() {
  return request('/literature/user/my-works');
}

export function getPendingWorks() {
  return request('/literature/admin/pending');
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
  return request(`/admin/users/${uid}`, {
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
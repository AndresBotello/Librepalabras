/**
 * De qué red es un enlace, deducido del dominio.
 *
 * No se le pide al administrador que elija la red en un desplegable: pega la
 * dirección y aquí se reconoce sola. Una cuenta mal etiquetada a mano sería un
 * icono equivocado para siempre, y el dominio nunca miente.
 *
 * Lo que no se reconoce no es un error: es la página propia del autor, que es
 * justamente uno de los casos que hay que admitir.
 */

export const PLATFORMS = {
  instagram: { label: 'Instagram', hosts: ['instagram.com'] },
  facebook: { label: 'Facebook', hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  x: { label: 'X', hosts: ['x.com', 'twitter.com'] },
  youtube: { label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  tiktok: { label: 'TikTok', hosts: ['tiktok.com'] },
  linkedin: { label: 'LinkedIn', hosts: ['linkedin.com'] },
  github: { label: 'GitHub', hosts: ['github.com'] },
  website: { label: 'Sitio web', hosts: [] },
};

/**
 * Solo http y https. Sin esto, un `javascript:` guardado en la ficha se
 * ejecutaría al pulsar el icono en la página pública.
 */
export function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  // Se admite que peguen "instagram.com/alguien" sin esquema.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function detectPlatform(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) return 'website';

  const host = new URL(normalized).hostname.replace(/^www\./, '').toLowerCase();

  for (const [key, platform] of Object.entries(PLATFORMS)) {
    // Se compara el dominio entero o un subdominio suyo, no un `includes`:
    // "notinstagram.com" no es Instagram.
    if (platform.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return key;
    }
  }

  return 'website';
}

/** Nombre legible del enlace, para el texto que leen los lectores de pantalla. */
export function platformLabel(value, customLabel = '') {
  const custom = String(customLabel || '').trim();
  if (custom) return custom;

  const platform = detectPlatform(value);
  if (platform !== 'website') return PLATFORMS[platform].label;

  const normalized = normalizeUrl(value);
  return normalized ? new URL(normalized).hostname.replace(/^www\./, '') : 'Enlace';
}

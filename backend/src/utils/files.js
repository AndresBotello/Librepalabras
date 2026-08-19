// Límites compartidos entre validación de subida y respuestas de error.
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Convierte el nombre original de un archivo en un slug seguro para usar como
 * public_id de Cloudinary. Quita rutas, acentos y cualquier carácter que pueda
 * romper la URL o servir para escapar de la carpeta destino.
 */
export function sanitizeFileName(name = '') {
  const withoutPath = String(name).split(/[/\\]/).pop() || '';
  const withoutExtension = withoutPath.replace(/\.[^.]+$/, '');

  const slug = withoutExtension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return slug || 'archivo';
}

/**
 * Un PDF real siempre empieza por "%PDF-". Comprobar la firma evita que alguien
 * suba otra cosa simplemente mintiendo en el mimetype o en la extensión.
 */
export function looksLikePdf(buffer) {
  if (!buffer || buffer.length < 5) {
    return false;
  }

  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/**
 * Saca el `public_id` de Cloudinary a partir de la URL guardada en el
 * documento, que es lo único que conservamos de un archivo subido.
 *
 * Entre `/upload/` y el nombre del archivo la URL mete la versión (`v1712…`) y,
 * a veces, transformaciones. Nada de eso forma parte del identificador: si se
 * cuelan dentro, `destroy` no encuentra el archivo y responde "not found" sin
 * lanzar error, que es la manera más silenciosa de ir dejando huérfanos en la
 * cuenta.
 */
export function cloudinaryPublicId(url) {
  const rest = String(url || '').split('/upload/')[1];

  if (!rest) return null;

  const segments = rest.split('/');
  const versionIndex = segments.findIndex(segment => /^v\d+$/.test(segment));
  const path = (versionIndex === -1 ? segments : segments.slice(versionIndex + 1)).join('/');

  return path.replace(/\.[^/.]+$/, '') || null;
}

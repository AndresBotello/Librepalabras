/**
 * Secciones especiales de la plataforma. Espejo de lo que la interfaz necesita
 * de `backend/src/config/sections.json` (igual que `genres.json`, que también
 * se mantiene en los dos lados). Quién puede publicar lo decide el servidor;
 * `uploadRoles` aquí solo sirve para no ofrecer un botón que acabaría en 403.
 */
export const SECTIONS = {
  ninos: {
    value: 'ninos',
    label: 'Los niños cuentan',
    path: '/los-ninos-cuentan',
    eyebrow: 'Voces pequeñas',
    description: 'Cuentos, poemas y dibujos de los más pequeños del territorio.',
    emptyText: 'Pronto compartiremos aquí los cuentos, poemas y dibujos de los niños.',
    uploadRoles: ['admin'],
    // Los dibujos son apaisados con frecuencia: la tarjeta es 4:3 y no la
    // portada de libro 2:3 de la biblioteca, que los recortaría.
    card: { aspect: 'aspect-[4/3]', grid: 'grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' },
    authors: {
      title: 'Voces de la casa',
      noteTitle: 'Las palabras de los más pequeños',
      note: 'Cada cuento, poema y dibujo se publica con la autorización de su familia. Detrás de cada uno hay un niño o una niña del territorio.',
    },
    kinds: [
      { value: 'cuento', label: 'Cuento', emoji: '📖' },
      { value: 'poema', label: 'Poema', emoji: '✨' },
      { value: 'dibujo', label: 'Dibujo', emoji: '🎨', imageRequired: true },
    ],
  },
  palabras: {
    value: 'palabras',
    label: 'Palabras sin dueños',
    path: '/palabras-sin-duenos',
    eyebrow: 'Voces del territorio',
    description: 'Vivencias, historias y obras de escritores del territorio.',
    emptyText: 'Aún no hay textos publicados en esta sección.',
    uploadRoles: ['admin', 'collaborator'],
    card: { aspect: 'aspect-[2/3]', grid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5' },
    authors: {
      title: 'Voces de la casa',
      noteTitle: 'Palabras que no tienen dueño',
      note: 'Vivencias, historias y obras de escritores del territorio: textos que pertenecen a la memoria de todos.',
    },
    kinds: [
      { value: 'vivencia', label: 'Vivencia', emoji: '🌿' },
      { value: 'historia', label: 'Historia', emoji: '📜' },
      { value: 'obra', label: 'Obra', emoji: '🖋️' },
    ],
  },
};

export function canPublishIn(section, role) {
  return section.uploadRoles.includes(role);
}

export function newWorkPath(section) {
  return `${section.path}/nueva`;
}

export function editWorkPath(section, id) {
  return `${section.path}/${encodeURIComponent(id)}/editar`;
}

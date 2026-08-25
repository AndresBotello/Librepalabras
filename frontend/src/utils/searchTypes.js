/**
 * Metadatos de cada tipo de resultado del buscador, compartidos entre el
 * desplegable de la portada (`SiteSearch`) y la página de resultados
 * (`Pages/Search/resultados.jsx`). Un solo sitio para la lista de tipos: si
 * mañana se indexa uno nuevo, hace falta tocar aquí y en `search.service.js`
 * del backend, no en cada componente que pinta un resultado.
 */

export const TYPE_BADGE = {
  obra: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  columna: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  autor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  poliversia: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  concurso: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  libro: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  encuentro: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

/**
 * Nombre del grupo por tipo.
 *
 * No se toma del `label` del resultado porque ese varía dentro de un mismo
 * tipo: un cuento premiado se anuncia como «Ganadores» y uno normal como
 * «Concursos», y el encabezado del grupo tiene que ser uno solo.
 */
export const TYPE_LABEL = {
  obra: 'Obras',
  columna: 'Columnas de opinión',
  autor: 'Autores',
  poliversia: 'Poliversia',
  concurso: 'Concursos',
  libro: 'Libros',
  encuentro: 'Grupo Focal',
};

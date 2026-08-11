
const MISSING_INDEX_CODE = 9; // FAILED_PRECONDITION

function isMissingIndexError(error) {
  return error?.code === MISSING_INDEX_CODE
    || /requires an index/i.test(error?.message || '');
}

export async function queryOrderedWithFallback(baseQuery, { orderField, direction = 'desc', limit }) {
  try {
    return await baseQuery.orderBy(orderField, direction).limit(limit).get();
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    console.warn(
      `⚠ Falta un índice compuesto en Firestore (orden por "${orderField}"). `
      + 'Ordenando en memoria como respaldo. Despliega firestore.indexes.json para quitar este aviso.'
    );

    // Se pide un margen sobre el límite pedido: sin orden en el servidor, los
    // documentos llegan en orden de id, así que recortar antes de ordenar
    // dejaría fuera los más recientes.
    const snapshot = await baseQuery.limit(limit * 5).get();

    const sorted = snapshot.docs.sort((a, b) => {
      const valueA = a.data()[orderField] || '';
      const valueB = b.data()[orderField] || '';

      if (valueA === valueB) return 0;

      const comparison = valueA < valueB ? -1 : 1;
      return direction === 'desc' ? -comparison : comparison;
    });

    // Se devuelve con la misma forma que un QuerySnapshot en lo que usan los
    // servicios: `docs`, `empty` y `size`.
    const docs = sorted.slice(0, limit);

    return { docs, empty: docs.length === 0, size: docs.length };
  }
}

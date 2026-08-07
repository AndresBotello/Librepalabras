import { useEffect, useState } from 'react';
import { getContestCatalog } from '../services/api';
import { CONTESTS } from '../utils/contests';

/**
 * Catálogo de concursos con el estado que decidió el administrador.
 *
 * Arranca con la definición local (nombres, slugs, descripciones) para que la
 * página pinte de inmediato, y la reemplaza cuando responde el backend: hasta
 * ese momento el estado mostrado puede ser el inicial, no el vigente.
 */
export default function useContestCatalog() {
  const [contests, setContests] = useState(CONTESTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getContestCatalog()
      .then((response) => {
        if (active && response.contests?.length) setContests(response.contests);
      })
      .catch(() => {
        // Si el catálogo no carga se sigue con la definición local: es
        // preferible a dejar la sección de concursos vacía.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { contests, loading, setContests };
}

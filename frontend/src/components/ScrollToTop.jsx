import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * El navegador conserva la posición del scroll al cambiar de ruta, así que sin
 * esto se entra a una página nueva por la mitad. Va dentro del Router y no
 * pinta nada: solo reacciona al cambio de ruta.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Un enlace con ancla (#seccion) quiere ir a esa sección, no arriba.
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }

    // 'instant' y no 'smooth': al cambiar de página el recorrido animado se ve
    // como un salto raro sobre contenido que aún se está montando.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search, hash]);

  return null;
}

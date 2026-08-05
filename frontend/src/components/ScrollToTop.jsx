import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * El navegador conserva la posición del scroll al cambiar de ruta, así que sin
 * esto se entra a una página nueva por la mitad. Va dentro del Router y no
 * pinta nada: solo reacciona al cambio de ruta.
 */
export default function ScrollToTop() {
  // Solo `pathname`: si dependiera también de `search`, cualquier filtro que
  // escriba en la URL saltaría al inicio mientras el usuario está leyendo.
  const { pathname } = useLocation();

  useEffect(() => {
    // La forma de dos argumentos, no la de objeto con `behavior`: está
    // soportada en todos los navegadores y no valida enums que puedan lanzar.
    try {
      window.scrollTo(0, 0);
    } catch {
      // Un fallo al desplazar es cosmético. Si se propagara desde un efecto,
      // React desmontaría el árbol entero y la página quedaría en blanco.
    }
  }, [pathname]);

  return null;
}

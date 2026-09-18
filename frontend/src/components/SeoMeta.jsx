import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * La aplicación es una SPA: el servidor devuelve el mismo index.html para todas
 * las rutas, así que sin esto Google vería el mismo título y la misma
 * descripción en cada página y las trataría como duplicadas. Googlebot ejecuta
 * el JavaScript, de modo que lee lo que este componente deja en el <head>.
 */

const SITE_URL = 'https://liberapalabras.com';

const DEFAULT_META = {
  title: 'Liberapalabras | Libera Palabras, revista literaria de Valledupar y el Caribe',
  description:
    'Liberapalabras (Libera Palabras) es el ecosistema literario del Cesar: cuentos, ensayo, poesía y memoria de Valledupar y el Caribe colombiano. Lee a nuestros autores, participa en los concursos y publica tu obra.',
};

const ROUTE_META = {
  '/': DEFAULT_META,
  '/home': DEFAULT_META,
  '/literature': {
    title: 'Literatura | Liberapalabras',
    description:
      'Cuentos, ensayo, poesía y crónica publicados por los autores de Liberapalabras. Literatura viva de Valledupar y el Caribe colombiano.',
  },
  '/stories': {
    title: 'Relatos | Liberapalabras',
    description:
      'Relatos y narrativa breve de la comunidad de Liberapalabras: memoria, ficción y voces del Cesar.',
  },
  '/poleversia': {
    title: 'Poleversia | Liberapalabras',
    description:
      'Poleversia, la colección editorial de Liberapalabras: libros y publicaciones para leer en línea.',
  },
  '/grupo-focal': {
    title: 'Grupo Focal Alfredo Correa De Andreís | Liberapalabras',
    description:
      'Cátedra y Tertulia Alfredo Correa De Andreís: reuniones virtuales y debate abierto sobre memoria, palabra y pensamiento crítico en el Caribe colombiano.',
  },
  '/authors': {
    title: 'Autores | Liberapalabras',
    description:
      'Conoce a los autores de Liberapalabras: escritores de Valledupar, el Cesar y el Caribe colombiano.',
  },
  '/concursos': {
    title: 'Concursos literarios | Liberapalabras',
    description:
      'Convocatorias y concursos literarios de Liberapalabras: bases, categorías, fechas y cómo participar.',
  },
  '/concursos/ganadores': {
    title: 'Ganadores de los concursos | Liberapalabras',
    description:
      'Obras y autores premiados en los concursos literarios de Liberapalabras.',
  },
  '/login': {
    title: 'Iniciar sesión | Liberapalabras',
    description: 'Accede a tu cuenta de Liberapalabras.',
  },
  '/register': {
    title: 'Crear cuenta | Liberapalabras',
    description: 'Regístrate en Liberapalabras para publicar tu obra y participar en los concursos.',
  },
};

// Coinciden con los Disallow de robots.txt. Aquí además se marcan noindex por
// si alguien llega por un enlace directo.
const PRIVATE_PREFIXES = ['/admin', '/collaborator', '/login', '/register', '/concursos/panel'];

function resolveMeta(pathname) {
  if (ROUTE_META[pathname]) {
    return ROUTE_META[pathname];
  }

  // Ficha de un encuentro concreto (/grupo-focal/:id).
  if (pathname.startsWith('/grupo-focal/')) {
    return {
      title: 'Encuentro del Grupo Focal | Liberapalabras',
      description: ROUTE_META['/grupo-focal'].description,
    };
  }

  // Ficha de un concurso concreto (/concursos/:slug): el título real lo pone la
  // página cuando carga los datos; esto es solo el punto de partida.
  if (pathname.startsWith('/concursos/')) {
    return {
      title: 'Concurso literario | Liberapalabras',
      description: ROUTE_META['/concursos'].description,
    };
  }

  return DEFAULT_META;
}

function upsertMeta(attribute, name, content) {
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

export default function SeoMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = resolveMeta(pathname);
    const isPrivate = PRIVATE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    // /home muestra lo mismo que la raíz: se declara la raíz como canónica para
    // que no compitan entre sí.
    const canonical = `${SITE_URL}${pathname === '/home' ? '/' : pathname}`;

    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta(
      'name',
      'robots',
      isPrivate ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'
    );
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', canonical);
    upsertCanonical(canonical);
  }, [pathname]);

  return null;
}

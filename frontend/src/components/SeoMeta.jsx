import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * La aplicación es una SPA: el servidor devuelve el mismo index.html para todas
 * las rutas, así que sin esto Google vería el mismo título y la misma
 * descripción en cada página y las trataría como duplicadas. Googlebot ejecuta
 * el JavaScript, de modo que lee lo que este componente deja en el <head>.
 */

const SITE_URL = 'https://librepalabras.com';

const DEFAULT_META = {
  title: 'Librepalabras | Libre Palabras, revista literaria de Valledupar y el Caribe',
  description:
    'Librepalabras (Libre Palabras) es el ecosistema literario del Cesar: cuentos, ensayo, poesía y memoria de Valledupar y el Caribe colombiano. Lee a nuestros autores, participa en los concursos y publica tu obra.',
};

const ROUTE_META = {
  '/': DEFAULT_META,
  '/home': DEFAULT_META,
  '/literature': {
    title: 'Literatura | Librepalabras',
    description:
      'Cuentos, ensayo, poesía y crónica publicados por los autores de Librepalabras. Literatura viva de Valledupar y el Caribe colombiano.',
  },
  '/stories': {
    title: 'Relatos | Librepalabras',
    description:
      'Relatos y narrativa breve de la comunidad de Librepalabras: memoria, ficción y voces del Cesar.',
  },
  '/poleversia': {
    title: 'Poleversia | Librepalabras',
    description:
      'Poleversia, la colección editorial de Librepalabras: libros y publicaciones para leer en línea.',
  },
  '/authors': {
    title: 'Autores | Librepalabras',
    description:
      'Conoce a los autores de Librepalabras: escritores de Valledupar, el Cesar y el Caribe colombiano.',
  },
  '/concursos': {
    title: 'Concursos literarios | Librepalabras',
    description:
      'Convocatorias y concursos literarios de Librepalabras: bases, categorías, fechas y cómo participar.',
  },
  '/concursos/ganadores': {
    title: 'Ganadores de los concursos | Librepalabras',
    description:
      'Obras y autores premiados en los concursos literarios de Librepalabras.',
  },
  '/login': {
    title: 'Iniciar sesión | Librepalabras',
    description: 'Accede a tu cuenta de Librepalabras.',
  },
  '/register': {
    title: 'Crear cuenta | Librepalabras',
    description: 'Regístrate en Librepalabras para publicar tu obra y participar en los concursos.',
  },
};

// Coinciden con los Disallow de robots.txt. Aquí además se marcan noindex por
// si alguien llega por un enlace directo.
const PRIVATE_PREFIXES = ['/admin', '/collaborator', '/login', '/register', '/concursos/panel'];

function resolveMeta(pathname) {
  if (ROUTE_META[pathname]) {
    return ROUTE_META[pathname];
  }

  // Ficha de un concurso concreto (/concursos/:slug): el título real lo pone la
  // página cuando carga los datos; esto es solo el punto de partida.
  if (pathname.startsWith('/concursos/')) {
    return {
      title: 'Concurso literario | Librepalabras',
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

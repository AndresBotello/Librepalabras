import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import SocialIcon from './SocialIcon';
import { platformLabel } from '../utils/socialLinks';
import logo from '../assets/Libera-Palabras.ico';

/**
 * Secciones públicas, en una sola línea.
 *
 * Solo rutas que existen. El pie anterior repartía nueve enlaces en cuatro
 * columnas ("Sobre nosotros", "Blog", "Privacidad", "Términos"...) y todos
 * apuntaban a `#`: ocupaban media pantalla para no llevar a ninguna parte.
 */
const FOOTER_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/literature', label: 'Libros' },
  { to: '/stories', label: 'Literatura' },
  { to: '/authors', label: 'Autores' },
  { to: '/concursos', label: 'Concursos' },
  { to: '/poleversia', label: 'Poleversia' },
  { to: '/grupo-focal', label: 'Grupo Focal' },
];

/**
 * Redes de la plataforma.
 *
 * Va vacío a propósito: no hay cuentas oficiales registradas en el proyecto, y
 * unos iconos apuntando a `#` se verían igual de rotos que los enlaces que se
 * acaban de quitar. Basta con pegar aquí las direcciones
 * —`'instagram.com/liberapalabras'`— para que la fila aparezca sola: el icono
 * y el nombre se deducen del dominio, igual que en las fichas de autor.
 */
const SOCIAL_LINKS = [];

export default function Footer() {
  const { isDark } = useContext(ThemeContext);

  // Calculado, no escrito a mano: el año fijo del pie anterior envejecía solo
  // y cada enero dejaba la plataforma con pinta de abandonada.
  const year = new Date().getFullYear();

  const mutedText = isDark ? 'text-gray-400' : 'text-brand-700';
  const linkText = isDark
    ? 'text-gray-400 hover:text-gray-100'
    : 'text-brand-700 hover:text-brand-800';

  return (
    <footer className={`w-full transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Filete de marca: separa el pie del contenido con el azul de la
          plataforma en lugar de con una línea gris más. */}
      <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--color-brand-700)' }} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 sm:py-12">
        {/* La marca a un lado y las secciones al otro. En móvil no hay "al
            lado", así que se apilan centradas. */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="text-center md:text-left">
            {/* El mismo logotipo de la barra superior, aquí con más aire: en el
                pie no compite con nada, así que puede ir a mayor tamaño y el
                eslogan que lleva dibujado empieza a leerse.

                La placa clara del modo oscuro es por lo mismo que arriba: el
                logo es verde casi negro sobre fondo transparente y sobre el gris
                del pie no se distinguiría. */}
            <Link
              to="/"
              aria-label="LiberaPalabras, ir al inicio"
              className="inline-flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src={logo}
                alt="LiberaPalabras"
                className={`h-14 w-auto ${isDark ? 'bg-gray-50 rounded-lg px-2.5 py-1.5' : ''}`}
              />
            </Link>
            <p className={`mt-3 text-sm max-w-xs mx-auto md:mx-0 transition-colors ${mutedText}`}>
              Conecta con la comunidad literaria más vibrante del Valle del César.
            </p>
          </div>

          {/* Cada enlace va en `whitespace-nowrap` y con su punto pegado
              detrás. Sin lo primero, "Grupo Focal" se parte por su espacio
              interno y "Focal" queda colgando solo en el renglón siguiente; sin
              lo segundo, al plegarse la fila un punto puede acabar abriendo
              línea, separado de la sección a la que acompaña. */}
          <nav
            aria-label="Secciones"
            className="flex flex-wrap items-center justify-center md:justify-end gap-y-1 text-sm"
          >
            {FOOTER_LINKS.map((link, index) => (
              <span key={link.to} className="inline-flex items-center whitespace-nowrap">
                <Link to={link.to} className={`transition-colors ${linkText}`}>
                  {link.label}
                </Link>
                {index < FOOTER_LINKS.length - 1 && (
                  <span aria-hidden="true" className={`mx-2.5 opacity-40 ${mutedText}`}>·</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className={`mt-10 pt-6 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-4 transition-colors ${
          isDark ? 'border-gray-800' : 'border-gray-300'
        }`}>
          {/* Los términos van aquí abajo y no en la fila de secciones: hay que
              poder encontrarlos desde cualquier página, pero no compiten en
              importancia con Libros o Concursos. */}
          <p className={`text-xs text-center sm:text-left transition-colors ${mutedText}`}>
            © {year} LiberaPalabras · Valledupar, Colombia
            <span aria-hidden="true" className="mx-2 opacity-40">·</span>
            <Link to="/terminos" className={`transition-colors ${linkText}`}>
              Términos y Condiciones
            </Link>
          </p>

          {SOCIAL_LINKS.length > 0 && (
            <div className="flex items-center gap-5">
              {SOCIAL_LINKS.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platformLabel(url)}
                  className={`transition-colors ${linkText}`}
                >
                  <SocialIcon url={url} size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

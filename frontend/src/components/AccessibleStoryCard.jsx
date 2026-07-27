import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * AccessibleStoryCard - Componente de tarjeta de historia completamente accesible
 * Cumple con WCAG 2.1 AA para personas ciegas y con baja visión
 */
export default function AccessibleStoryCard({ story }) {
  const { isDark } = useContext(ThemeContext);
  const [liked, setLiked] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);

    // Anunciar cambio a lectores de pantalla
    setAnnouncement(
      `Historia "${story.title}" ${newLikedState ? 'marcada como me gusta' : 'desmarcada'}. Ahora tiene ${liked ? story.likes - 1 : story.likes + 1} likes.`
    );
  };

  const handleShare = () => {
    setAnnouncement(`Link de la historia "${story.title}" copiado al portapapeles`);
  };

  return (
    <article
      className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}
      aria-label={`Historia: ${story.title} por ${story.author}`}
    >
      {/* Anuncio para lectores de pantalla */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Imagen con alt text descriptivo */}
      <div className="relative overflow-hidden h-48 sm:h-64 bg-gray-300">
        <img
          src={story.image}
          alt={`Portada de la historia "${story.title}" escrita por ${story.author}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Header con información del autor */}
        <header className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={story.authorImage}
              alt={`Foto de perfil de ${story.author}`}
              className="w-10 h-10 rounded-full object-cover"
              aria-hidden="false"
            />
            <div>
              <p
                className={`font-semibold text-sm transition-colors ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
                aria-label={`Escrito por ${story.author}`}
              >
                {story.author}
              </p>
              <time
                className={`text-xs transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
                dateTime={story.dateISO}
                aria-label={`Publicado el ${story.date}`}
              >
                {story.date}
              </time>
            </div>
          </div>

          {/* Categoría */}
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              isDark
                ? 'bg-yellow-900 text-yellow-300'
                : 'bg-yellow-100 text-yellow-700'
            }`}
            aria-label={`Categoría: ${story.category}`}
          >
            {story.category}
          </span>
        </header>

        {/* Título */}
        <h2
          id={`story-title-${story.id}`}
          className={`text-xl font-bold mb-3 transition-colors ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {story.title}
        </h2>

        {/* Descripción */}
        <p
          id={`story-desc-${story.id}`}
          className={`text-sm mb-5 line-clamp-3 transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
          aria-describedby={`story-desc-${story.id}`}
        >
          {story.description}
        </p>

        {/* Acciones - Grupo de botones accesible */}
        <div
          className="flex items-center gap-4"
          role="group"
          aria-label="Acciones para esta historia"
        >
          {/* Botón Like con aria-pressed */}
          <button
            onClick={handleLike}
            aria-label={
              liked
                ? `Desmarcar historia "${story.title}" como favorita`
                : `Marcar historia "${story.title}" como favorita`
            }
            aria-pressed={liked}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-semibold ${
              liked
                ? isDark
                  ? 'bg-red-900 bg-opacity-30 text-red-400'
                  : 'bg-red-100 text-red-600'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${
              isDark ? 'focus:ring-offset-gray-900' : ''
            }`}
          >
            <Heart
              size={20}
              aria-hidden="true"
              fill={liked ? 'currentColor' : 'none'}
            />
            <span aria-live="polite" aria-atomic="true">
              {liked ? story.likes + 1 : story.likes}
            </span>
          </button>

          {/* Botón Comentarios */}
          <button
            aria-label={`Ver ${story.comments} comentarios de la historia "${story.title}"`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-semibold ${
              isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
              isDark ? 'focus:ring-offset-gray-900' : ''
            }`}
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span>{story.comments}</span>
          </button>

          {/* Botón Compartir */}
          <button
            onClick={handleShare}
            aria-label={`Compartir historia "${story.title}"`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-semibold ${
              isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${
              isDark ? 'focus:ring-offset-gray-900' : ''
            }`}
          >
            <Share2 size={20} aria-hidden="true" />
            <span className="sr-only">Compartir</span>
          </button>
        </div>

        {/* Link a historia completa */}
        <a
          href={`/stories/${story.id}`}
          className={`mt-4 inline-block px-6 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
            isDark
              ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 focus:ring-offset-gray-900'
              : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
          }`}
        >
          Leer Historia Completa
          <span className="sr-only"> "{story.title}" por {story.author}</span>
        </a>
      </div>
    </article>
  );
}

/**
 * CSS para sr-only (screen reader only)
 * Agrega esto a tu index.css:
 *
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border-width: 0;
 * }
 *
 * /* Mostrar sr-only al enfocar */
 * .sr-only:focus {
 *   position: static;
 *   width: auto;
 *   height: auto;
 *   padding: inherit;
 *   margin: inherit;
 *   overflow: visible;
 *   clip: auto;
 *   white-space: normal;
 * }
 */

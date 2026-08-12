import React, { useState } from 'react';
import genresData from '../config/genres.json';
import LiteraryRatings from './LiteraryRatings';
import LiteraryComments from './LiteraryComments';
import { useAuth } from '../context/AuthContext';
import { toggleWorkLike } from '../services/api';

export default function LiteraryWorkViewer({ work, isDark, onUpdate }) {
  const [workData, setWorkData] = useState(work);
  const [likeLoading, setLikeLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const genreInfo = genresData.genres.find(g => g.value === work.genre);
  const genreEmoji = genreInfo?.emoji || '📚';

  const handleRatingAdded = (newAverage) => {
    setWorkData(prev => ({ ...prev, averageRating: newAverage }));
  };

  const handleCommentAdded = (comment, action, commentId) => {
    if (action === 'delete') {
      setWorkData(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId),
        totalComments: (prev.totalComments || 0) - 1,
      }));
    } else if (action === 'like' && comment) {
      setWorkData(prev => ({
        ...prev,
        comments: prev.comments.map(c => c.id === commentId ? comment : c),
      }));
    } else {
      setWorkData(prev => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
        totalComments: (prev.totalComments || 0) + 1,
      }));
    }
  };

  const handleToggleLike = async () => {
    setLikeLoading(true);
    try {
      const response = await toggleWorkLike(work.id);
      if (response.ok) {
        setWorkData(prev => ({
          ...prev,
          likesCount: response.likesCount || 0,
          likedByUsers: response.liked ? [...(prev.likedByUsers || []), user?.uid].filter(Boolean) : (prev.likedByUsers || []).filter(id => id !== user?.uid),
          likedByIpHashes: prev.likedByIpHashes || [],
        }));
      }
    } catch (err) {
      console.error('Error al dar like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const isUserLike = isAuthenticated && workData.likedByUsers?.includes(user?.uid);
  const liked = isUserLike || (workData.likedByIpHashes?.length > 0 && !isAuthenticated);

  return (
    <div className={`space-y-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Portada y Header */}
      <div
        className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Cover Image Section */}
          <div className="md:col-span-1">
            {workData.cover ? (
              <div className="space-y-3">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  📖 Portada
                </h3>
                <img
                  src={workData.cover}
                  alt={workData.title}
                  className="w-full rounded-lg shadow-lg object-cover aspect-[3/4] border-2"
                  style={{ borderColor: isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)' }}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              </div>
            ) : (
              <div className={`w-full aspect-[3/4] rounded-lg flex items-center justify-center text-3xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-200 border border-gray-300'}`}>
                📘
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-3">
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {workData.title}
            </h1>

            {/* Metadatos */}
            <div className="flex flex-wrap gap-4 text-sm mb-6">
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {genreEmoji} {genreInfo?.label || workData.genre}
              </div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Por: <strong>{workData.author}</strong>
              </div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                👁️ {workData.views || 0} vistas
              </div>
              {workData.type === 'pdfSale' && (
                <div className={`px-3 py-1 rounded-full font-semibold ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                  💰 ${workData.price}
                </div>
              )}
              {workData.averageRating > 0 && (
                <div className={isDark ? 'text-yellow-400' : 'text-yellow-500'}>
                  ⭐ {workData.averageRating.toFixed(1)} ({workData.totalRatings || 0})
                </div>
              )}
            </div>

            {/* Descripción */}
            {workData.description && (
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4 text-sm leading-relaxed`}>
                {workData.description}
              </p>
            )}

            {/* Tags */}
            {workData.tags && workData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {workData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - PDF y descarga */}
        <div className="border-t pt-6 flex flex-wrap gap-3" style={{ borderColor: isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)' }}>
          {workData.type === 'pdfSale' && (
            <button
              onClick={() => workData.pdfUrl && window.open(workData.pdfUrl, '_blank')}
              disabled={!workData.pdfUrl}
              className="px-6 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💳 Comprar PDF - ${workData.price}
            </button>
          )}
          {workData.type === 'free' && workData.pdfUrl && (
            <a
              href={workData.pdfUrl}
              download
              className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              📥 Descargar PDF
            </a>
          )}
          {workData.type === 'free' && !workData.pdfUrl && (
            <button className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2">
              📖 Leer Ahora
            </button>
          )}
          <button
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              liked
                ? isDark
                  ? 'bg-red-900 text-red-200 hover:bg-red-800'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                : isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {liked ? '❤️' : '🤍'} {workData.likesCount || 0} Me gusta
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className={`rounded-lg p-8 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          Contenido
        </h2>
        <pre
          className={`font-serif text-base leading-relaxed whitespace-pre-wrap break-words p-4 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-800'}`}
        >
          {workData.content}
        </pre>
      </div>

      {/* Ratings */}
      <LiteraryRatings
        workId={work.id}
        ratings={workData.ratings || []}
        averageRating={workData.averageRating || 0}
        isDark={isDark}
        onRatingAdded={handleRatingAdded}
      />

      {/* Comentarios */}
      <LiteraryComments
        workId={work.id}
        comments={workData.comments || []}
        isDark={isDark}
        onCommentAdded={handleCommentAdded}
        authorId={workData.authorId}
      />
    </div>
  );
}

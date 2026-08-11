import React, { useState } from 'react';
import {
  REPORT_REASON_LABELS,
  addComment,
  deleteComment,
  reportComment,
  toggleCommentLike,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

export default function LiteraryComments({ workId, comments = [], isDark, onCommentAdded, authorId }) {
  const { confirm, notify } = useDialog();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState({});
  // Qué comentario tiene abierto el selector de motivo, y cuáles ya se
  // reportaron en esta sesión (para no ofrecer denunciar dos veces lo mismo).
  const [reportingId, setReportingId] = useState(null);
  const [reportedIds, setReportedIds] = useState([]);
  const [reportFeedback, setReportFeedback] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const userId = user?.uid;

  const handleReport = async (commentId, reason) => {
    setReportingId(null);

    try {
      const response = await reportComment(workId, commentId, reason);
      setReportedIds((prev) => [...prev, commentId]);
      setReportFeedback({ type: 'success', text: response.message });
    } catch (error) {
      setReportFeedback({ type: 'error', text: error.message });
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length < 3) return;

    setLoading(true);
    try {
      const response = await addComment(workId, newComment);
      if (response.ok) {
        setNewComment('');
        if (onCommentAdded) onCommentAdded(response.comment);
      }
    } catch (err) {
      console.error('Error al comentar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const comment = comments.find(c => c.id === commentId);

    const confirmed = await confirm({
      title: 'Eliminar comentario',
      message: 'El comentario desaparecerá de la obra. No se puede deshacer.',
      detail: comment?.text,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteComment(workId, commentId);
      if (onCommentAdded) onCommentAdded(null, 'delete', commentId);
    } catch (err) {
      console.error('Error al eliminar comentario:', err);
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!isAuthenticated) {
      notify.info('Inicia sesión para dar me gusta.');
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setLikeLoading(prev => ({ ...prev, [commentId]: true }));
    try {
      const response = await toggleCommentLike(workId, commentId);
      if (response.ok) {
        const updatedComment = {
          ...comment,
          likesCount: response.likesCount,
          likedBy: response.liked
            ? [...(comment.likedBy || []), userId]
            : (comment.likedBy || []).filter(id => id !== userId),
        };
        if (onCommentAdded) onCommentAdded(updatedComment, 'like', commentId);
      }
    } catch (err) {
      console.error('Error al dar like:', err);
    } finally {
      setLikeLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        💬 Comentarios ({comments.length})
      </h3>

      {/* Formulario de comentario */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            maxLength="300"
            className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim() || newComment.length < 3}
            className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {newComment.length}/300
        </p>
      </form>

      {/* Lista de comentarios */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sin comentarios aún. ¡Sé el primero!
          </p>
        ) : (
          comments.map((comment) => {
            const isLiked = comment.likedBy?.includes(userId);
            return (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {comment.userName}
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(comment.createdAt).toLocaleString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <button
                        onClick={() => handleToggleLike(comment.id)}
                        disabled={likeLoading[comment.id]}
                        className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                          isLiked
                            ? isDark
                              ? 'bg-red-900 text-red-200'
                              : 'bg-red-100 text-red-800'
                            : isDark
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span>{isLiked ? '❤️' : '🤍'}</span>
                        <span>{comment.likesCount || 0}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    {/* Reportar: para cualquier usuario con sesión salvo el
                        propio autor del comentario. No borra nada; solo abre un
                        caso para que un moderador decida. */}
                    {isAuthenticated && userId !== comment.userId && (
                      reportedIds.includes(comment.id) ? (
                        <span className={`text-xs px-2 py-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Reportado
                        </span>
                      ) : (
                        <button
                          onClick={() => setReportingId(reportingId === comment.id ? null : comment.id)}
                          aria-label="Reportar este comentario"
                          title="Reportar este comentario"
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isDark
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          ⚑
                        </button>
                      )
                    )}

                    {/* Eliminar: autor del comentario o autor de la obra */}
                    {(userId === comment.userId || userId === authorId) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          isDark
                            ? 'bg-red-900 text-red-200 hover:bg-red-800'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                {reportingId === comment.id && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      ¿Por qué reportas este comentario?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => handleReport(comment.id, value)}
                          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                            isDark
                              ? 'bg-gray-600 text-gray-200 hover:bg-amber-800'
                              : 'bg-gray-100 text-gray-700 hover:bg-amber-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        onClick={() => setReportingId(null)}
                        className={`text-xs px-3 py-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {reportFeedback && (
        <p
          role="status"
          className={`text-xs mt-3 px-3 py-2 rounded ${
            reportFeedback.type === 'success'
              ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
              : isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {reportFeedback.text}
        </p>
      )}
    </div>
  );
}

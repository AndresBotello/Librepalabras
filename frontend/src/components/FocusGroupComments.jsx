import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import {
  addFocusGroupComment,
  deleteFocusGroupComment,
  toggleFocusGroupCommentLike,
} from '../services/api';

const MAX_LENGTH = 1000;
const MIN_LENGTH = 3;

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * La conversación de un encuentro del grupo focal.
 *
 * El estado de la lista lo lleva la página, no este componente: así el contador
 * de comentarios de la cabecera y la lista no pueden discrepar.
 */
export default function FocusGroupComments({ sessionId, comments = [], allowComments = true, onChange }) {
  const { isDark } = useContext(ThemeContext);
  const { user, isAuthenticated } = useAuth();
  const { confirm, notify } = useDialog();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [likingId, setLikingId] = useState(null);

  const userId = user?.uid;
  const isAdmin = user?.role === 'admin';
  const trimmed = text.trim();
  const canSend = trimmed.length >= MIN_LENGTH && !sending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    setSending(true);
    try {
      const response = await addFocusGroupComment(sessionId, trimmed);
      setText('');
      onChange?.([...comments, response.comment]);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (comment) => {
    const confirmed = await confirm({
      title: 'Eliminar comentario',
      message: 'El comentario desaparecerá de la conversación. No se puede deshacer.',
      detail: comment.text,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteFocusGroupComment(sessionId, comment.id);
      onChange?.(comments.filter((item) => item.id !== comment.id));
    } catch (error) {
      notify.error(error.message);
    }
  };

  const handleLike = async (comment) => {
    if (!isAuthenticated) {
      notify.info('Inicia sesión para reaccionar a un comentario.');
      return;
    }

    setLikingId(comment.id);
    try {
      const response = await toggleFocusGroupCommentLike(sessionId, comment.id);

      onChange?.(comments.map((item) => (
        item.id === comment.id
          ? {
              ...item,
              likesCount: response.likesCount,
              likedBy: response.liked
                ? [...(item.likedBy || []), userId]
                : (item.likedBy || []).filter((id) => id !== userId),
            }
          : item
      )));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLikingId(null);
    }
  };

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-stone-200'}`}>
      <h2 className={`flex items-center gap-2 text-lg font-semibold mb-5 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
        <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-brand-700)' }} />
        Conversación ({comments.length})
      </h2>

      {!allowComments ? (
        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
          Los comentarios están cerrados en este encuentro.
        </p>
      ) : isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
            rows={3}
            placeholder="Aporta al tema: una idea, una pregunta, una experiencia…"
            disabled={sending}
            className={`w-full px-4 py-3 rounded-xl border text-sm resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
              isDark
                ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder-stone-500'
                : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
            }`}
          />
          <div className="flex items-center justify-between gap-3 mt-2">
            <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              {text.length}/{MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-brand-700)' }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>
      ) : (
        <p className={`mb-6 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
          <Link to="/login" className="font-semibold underline" style={{ color: 'var(--color-brand-700)' }}>
            Inicia sesión
          </Link>{' '}
          para participar en la conversación.
        </p>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className={`text-sm py-6 text-center ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
            Todavía nadie ha comentado. Abre tú la conversación.
          </p>
        ) : (
          comments.map((comment) => {
            const liked = (comment.likedBy || []).includes(userId);
            const canDelete = userId === comment.userId || isAdmin;

            return (
              <article
                key={comment.id}
                className={`rounded-xl border p-4 ${isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-stone-50 border-stone-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {comment.userPhoto ? (
                      <img src={comment.userPhoto} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span
                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: 'var(--color-brand-700)' }}
                      >
                        {(comment.userName || 'A').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                        {comment.userName}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment)}
                      aria-label="Eliminar comentario"
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        isDark ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  {comment.text}
                </p>

                <button
                  type="button"
                  onClick={() => handleLike(comment)}
                  disabled={likingId === comment.id}
                  className={`mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                    liked
                      ? isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-800'
                      : isDark ? 'bg-stone-800 text-stone-400 hover:bg-stone-700' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  <span>{liked ? '★' : '☆'}</span>
                  <span>{comment.likesCount || 0}</span>
                </button>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

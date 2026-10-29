import React, { useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import {
  addFocusGroupComment,
  deleteFocusGroupComment,
  toggleFocusGroupCommentLike,
} from '../services/api';

// Cinco mil caracteres: caben tres párrafos de siete renglones con saludo y
// conclusiones, que es lo que piden los foros académicos de este espacio.
const MAX_LENGTH = 5000;
const MIN_LENGTH = 3;
const MAX_NAME = 60;
const MIN_NAME = 2;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

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

  const captchaRef = useRef(null);

  const [text, setText] = useState('');
  const [name, setName] = useState('');
  // Campo trampa para bots: oculto a las personas, debe quedar siempre vacío.
  const [website, setWebsite] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [likingId, setLikingId] = useState(null);

  const userId = user?.uid;
  const isAdmin = user?.role === 'admin';
  const trimmed = text.trim();
  const needsCaptcha = !isAuthenticated && Boolean(RECAPTCHA_SITE_KEY);
  const canSend = trimmed.length >= MIN_LENGTH
    && !sending
    && (isAuthenticated || name.trim().length >= MIN_NAME)
    && (!needsCaptcha || Boolean(captchaToken));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    setSending(true);
    setFormError('');
    try {
      const payload = { text: trimmed, website };
      if (!isAuthenticated) {
        payload.name = name.trim();
        payload.captchaToken = captchaToken;
      }

      const response = await addFocusGroupComment(sessionId, payload);
      setText('');
      onChange?.([...comments, response.comment]);
    } catch (error) {
      setFormError(error.message);
    } finally {
      // El token de reCAPTCHA es de un solo uso: haya salido bien o mal, hay
      // que pedir uno nuevo para el siguiente comentario.
      captchaRef.current?.reset();
      setCaptchaToken('');
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
      ) : (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          {!isAuthenticated && (
            <div>
              <label htmlFor="focus-comment-name" className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Tu nombre
              </label>
              <input
                id="focus-comment-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, MAX_NAME))}
                placeholder="Nombres y apellidos"
                autoComplete="name"
                disabled={sending}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                  isDark
                    ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder-stone-500'
                    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>
          )}

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
            rows={6}
            placeholder="Aporta al tema: una idea, una pregunta, una experiencia…"
            aria-label="Tu comentario"
            disabled={sending}
            className={`w-full px-4 py-3 rounded-xl border text-sm resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
              isDark
                ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder-stone-500'
                : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
            }`}
          />

          {/* Campo trampa: fuera de pantalla y fuera del orden de tabulación. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="focus-comment-website">No rellenar</label>
            <input
              id="focus-comment-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          {needsCaptcha && (
            <div className="overflow-x-auto">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                theme={isDark ? 'dark' : 'light'}
                onChange={(token) => setCaptchaToken(token || '')}
                onExpired={() => setCaptchaToken('')}
              />
            </div>
          )}

          {formError && (
            <p role="alert" className={`text-sm px-3 py-2 rounded-lg ${isDark ? 'bg-rose-950/50 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              {text.length.toLocaleString('es-CO')}/{MAX_LENGTH.toLocaleString('es-CO')}
            </span>
            <div className="flex items-center gap-3">
              {!isAuthenticated && (
                <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  ¿Tienes cuenta?{' '}
                  <Link to="/login" className="font-semibold underline" style={{ color: 'var(--color-brand-700)' }}>
                    Inicia sesión
                  </Link>
                </span>
              )}
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
          </div>
        </form>
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
                      <p className={`flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                        <span className="truncate">{comment.userName}</span>
                        {comment.isGuest && (
                          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-200 text-stone-600'}`}>
                            Visitante
                          </span>
                        )}
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

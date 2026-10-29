import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  addOpinionColumnComment,
  deleteOpinionColumnComment,
  getOpinionColumnComments,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

const MAX_TEXT = 1000;
const MIN_TEXT = 3;
const MAX_NAME = 40;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function formatDateTime(value) {
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
 * Comentarios de una columna de opinión. Comentan tanto usuarios con sesión
 * como visitantes: estos últimos dejan un nombre opcional y resuelven un
 * captcha, y su comentario lleva la etiqueta «Visitante».
 *
 * `columnId` es el id del documento, no el slug de la URL.
 */
export default function OpinionColumnComments({ columnId, isDark }) {
  const { user, isAuthenticated } = useAuth();
  const { confirm, notify } = useDialog();
  const captchaRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [text, setText] = useState('');
  const [name, setName] = useState('');
  // Campo trampa para bots: oculto a las personas, debe quedar siempre vacío.
  const [website, setWebsite] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const userId = user?.uid;

  // Al iniciar o cerrar sesión cambia qué comentarios son "míos" y cuáles se
  // pueden borrar, así que `userId` también vuelve a pedir la lista.
  useEffect(() => {
    if (!columnId) return undefined;

    let cancelled = false;

    async function loadComments() {
      try {
        const response = await getOpinionColumnComments(columnId);
        if (cancelled) return;
        setComments(response.comments || []);
        setTotal(response.total || 0);
        setHasMore(Boolean(response.hasMore));
        setLoadError('');
      } catch (error) {
        if (!cancelled) setLoadError(error.message || 'No se pudieron cargar los comentarios.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [columnId, userId, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const handleLoadMore = async () => {
    const last = comments[comments.length - 1];
    if (!last) return;

    setLoadingMore(true);
    try {
      const response = await getOpinionColumnComments(columnId, { before: last.createdAt });
      setComments((prev) => [...prev, ...(response.comments || [])]);
      setHasMore(Boolean(response.hasMore));
    } catch (error) {
      notify.error(error.message || 'No se pudieron cargar más comentarios.');
    } finally {
      setLoadingMore(false);
    }
  };

  const resetCaptcha = () => {
    captchaRef.current?.reset();
    setCaptchaToken('');
  };

  const trimmedLength = text.trim().length;
  const needsCaptcha = !isAuthenticated && Boolean(RECAPTCHA_SITE_KEY);
  const canSubmit = !submitting && trimmedLength >= MIN_TEXT && (!needsCaptcha || Boolean(captchaToken));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setFormError('');

    try {
      const payload = { text: text.trim(), website };
      if (!isAuthenticated) {
        payload.name = name.trim();
        payload.captchaToken = captchaToken;
      }

      const response = await addOpinionColumnComment(columnId, payload);

      if (response.comment) {
        setComments((prev) => [response.comment, ...prev]);
        setTotal((prev) => prev + 1);
      }

      setText('');
      notify.success('Tu comentario fue publicado.');
    } catch (error) {
      setFormError(error.message || 'No se pudo publicar el comentario.');
    } finally {
      // El token de reCAPTCHA es de un solo uso: haya salido bien o mal, hay
      // que pedir uno nuevo para el siguiente comentario.
      resetCaptcha();
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment) => {
    const confirmed = await confirm({
      title: 'Eliminar comentario',
      message: 'El comentario desaparecerá de la columna. No se puede deshacer.',
      detail: comment.text,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteOpinionColumnComment(columnId, comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error) {
      notify.error(error.message || 'No se pudo eliminar el comentario.');
    }
  };

  const surface = isDark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50';
  const inputClass = `w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
    isDark
      ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder-slate-500 focus:ring-amber-400/60'
      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-brand-700/40'
  }`;
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <section aria-labelledby="column-comments-title" className={`border-t pt-8 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
      <h2
        id="column-comments-title"
        className={`text-2xl font-black uppercase tracking-[-0.03em] ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        Comentarios{total > 0 ? ` (${total})` : ''}
      </h2>
      <p className={`mt-1 text-sm ${mutedText}`}>
        Comparte tu opinión sobre esta columna. {isAuthenticated ? 'Comentas con tu cuenta.' : 'No necesitas cuenta para comentar.'}
      </p>

      <form onSubmit={handleSubmit} className={`mt-5 space-y-3 rounded-2xl border p-4 sm:p-5 ${surface}`}>
        {!isAuthenticated && (
          <div>
            <label htmlFor="comment-name" className={`mb-1 block text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
              Tu nombre <span className="font-normal normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              id="comment-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_NAME}
              placeholder="Visitante"
              autoComplete="nickname"
              disabled={submitting}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="comment-text" className={`mb-1 block text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Tu comentario
          </label>
          <textarea
            id="comment-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_TEXT}
            rows={4}
            placeholder="Escribe tu opinión con respeto…"
            disabled={submitting}
            className={`${inputClass} resize-y`}
          />
          <p className={`mt-1 text-right text-xs ${mutedText}`}>
            {text.length}/{MAX_TEXT}
          </p>
        </div>

        {/* Campo trampa: fuera de pantalla y fuera del orden de tabulación. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="comment-website">No rellenar</label>
          <input
            id="comment-website"
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
          <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
            {formError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!isAuthenticated ? (
            <p className={`text-xs ${mutedText}`}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className={`font-semibold underline ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>
                Inicia sesión
              </Link>
            </p>
          ) : <span />}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center rounded-full bg-brand-700 px-6 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Publicando…' : 'Publicar comentario'}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className={`py-4 text-center text-sm ${mutedText}`}>Cargando comentarios…</p>
        ) : loadError ? (
          <div className={`rounded-xl px-4 py-3 text-center text-sm ${isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
            <p>{loadError}</p>
            <button type="button" onClick={handleRetry} className="mt-2 font-semibold underline">
              Reintentar
            </button>
          </div>
        ) : comments.length === 0 ? (
          <p className={`py-4 text-center text-sm ${mutedText}`}>Todavía no hay comentarios. ¡Sé la primera persona en opinar!</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`break-words text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {comment.authorName}
                    </span>
                    {comment.isGuest && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        Visitante
                      </span>
                    )}
                    {comment.mine && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
                        Tú
                      </span>
                    )}
                  </p>
                  <p className={`mt-0.5 text-xs ${mutedText}`}>{formatDateTime(comment.createdAt)}</p>
                </div>

                {comment.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment)}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isDark ? 'bg-red-900/60 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {/* Texto plano: React lo escapa, y `whitespace-pre-wrap` conserva
                  los saltos de línea que escribió la persona. */}
              <p className={`mt-3 whitespace-pre-wrap break-words text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {comment.text}
              </p>
            </article>
          ))
        )}

        {hasMore && !loading && !loadError && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition disabled:opacity-50 ${
                isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {loadingMore ? 'Cargando…' : 'Ver más comentarios'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

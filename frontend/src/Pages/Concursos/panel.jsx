import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockOpen,
  Star,
  Trash2,
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext.jsx';
import useContestCatalog from '../../hooks/useContestCatalog';
import {
  CONTEST_MAX_SCORE,
  CONTEST_MIN_SCORE,
  CONTEST_STATUS_LABELS,
  deleteContestStory,
  getContestPanel,
  rateContestStory,
  setContestStoryEvaluation,
  setContestStoryPublication,
} from '../../services/api';

const FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'en_evaluacion', label: 'En evaluación' },
  { value: 'calificado', label: 'Calificados' },
  { value: 'publicado', label: 'Publicados' },
];

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

export default function ContestPanel() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const { contests } = useContestCatalog();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [contestFilter, setContestFilter] = useState('todos');
  const [expandedId, setExpandedId] = useState(null);
  const [status, setStatus] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const isAdmin = user?.role === 'admin';

  const refresh = async () => {
    try {
      const response = await getContestPanel();
      setStories(response.stories || []);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    getContestPanel()
      .then((response) => {
        if (active) setStories(response.stories || []);
      })
      .catch((error) => {
        if (active) setStatus({ type: 'error', message: error.message });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Solo se ofrecen los concursos que ya tienen cuentos inscritos: no tiene
  // sentido filtrar por una convocatoria vacía.
  const contestsWithStories = useMemo(
    () => contests.filter((contest) => stories.some((story) => story.contestId === contest.id)),
    [contests, stories]
  );

  const contestLabel = (id) => {
    const contest = contests.find((item) => item.id === id);
    if (!contest) return 'Concurso';

    return contest.edition ? `${contest.shortName} ${contest.edition}` : contest.shortName;
  };

  const visibleStories = useMemo(() => {
    return stories
      .filter((story) => filter === 'todos' || story.status === filter)
      .filter((story) => contestFilter === 'todos' || story.contestId === contestFilter);
  }, [stories, filter, contestFilter]);

  const runAction = async (storyId, action, successMessage) => {
    setBusyId(storyId);
    setStatus(null);

    try {
      await action();
      await refresh();
      setStatus({ type: 'success', message: successMessage });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const togglePublication = (story) => {
    const publish = !story.isPublished;

    setConfirmation({
      title: publish ? 'Publicar este cuento' : 'Retirar este cuento',
      message: publish
        ? `"${story.title}" quedará visible para cualquier visitante en la página del concurso. Las notas y comentarios del jurado seguirán siendo internos.`
        : `"${story.title}" dejará de aparecer en la página pública del concurso.`,
      confirmLabel: publish ? 'Sí, publicar' : 'Sí, retirar',
      onConfirm: () => {
        setConfirmation(null);
        runAction(
          story.id,
          () => setContestStoryPublication(story.id, publish),
          publish ? 'Cuento publicado.' : 'Cuento retirado de la página pública.'
        );
      },
    });
  };

  const toggleEvaluation = (story) => {
    const close = !story.evaluationClosed;

    setConfirmation({
      title: close ? 'Cerrar la evaluación' : 'Reabrir la evaluación',
      message: close
        ? `"${story.title}" pasará al estado "Calificado" y su autor ya no podrá editarlo.`
        : `"${story.title}" volverá a evaluación y su autor podrá editarlo de nuevo.`,
      confirmLabel: close ? 'Sí, cerrar' : 'Sí, reabrir',
      onConfirm: () => {
        setConfirmation(null);
        runAction(
          story.id,
          () => setContestStoryEvaluation(story.id, close),
          close ? 'Evaluación cerrada.' : 'Evaluación reabierta.'
        );
      },
    });
  };

  const requestDelete = (story) => {
    setConfirmation({
      title: 'Eliminar del concurso',
      message: `Se borrarán "${story.title}" y todas sus calificaciones. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      danger: true,
      onConfirm: () => {
        setConfirmation(null);
        runAction(story.id, () => deleteContestStory(story.id), 'Cuento eliminado del concurso.');
      },
    });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        {/* Cada rol conserva su propia navegación mientras califica. */}
        {isAdmin ? <AdminSidebar /> : <CollaboratorSidebar />}

        <main className="flex-1 px-4 sm:px-8 py-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <header className="mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
                Panel de calificación
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Todos los concursos. Calificar y publicar son decisiones independientes:
                puedes publicar un cuento aunque no esté calificado.
              </p>
            </header>

            {status && (
              <div className={`mb-6 rounded-xl px-4 py-3 text-sm border ${
                status.type === 'success'
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {status.message}
              </div>
            )}

            {contestsWithStories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {[{ id: 'todos', shortName: 'Todos los concursos', edition: '' }, ...contestsWithStories].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContestFilter(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      contestFilter === item.id
                        ? isDark
                          ? 'bg-amber-950/50 text-amber-300 border-amber-800'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                        : isDark
                          ? 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {item.shortName}
                    {item.edition && <span className="ml-1 opacity-70">{item.edition}</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filter === item.value
                      ? 'bg-[#5D4037] text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={`flex items-center justify-center gap-3 py-20 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando cuentos…
              </div>
            ) : visibleStories.length === 0 ? (
              <div className={`rounded-2xl border border-dashed px-6 py-16 text-center text-sm ${
                isDark ? 'border-gray-800 text-gray-400' : 'border-gray-300 text-gray-600'
              }`}>
                No hay cuentos en esta categoría.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    contestName={contestLabel(story.contestId)}
                    isDark={isDark}
                    isAdmin={isAdmin}
                    busy={busyId === story.id}
                    expanded={expandedId === story.id}
                    onToggle={() => setExpandedId(expandedId === story.id ? null : story.id)}
                    onTogglePublication={() => togglePublication(story)}
                    onToggleEvaluation={() => toggleEvaluation(story)}
                    onDelete={() => requestDelete(story)}
                    onRated={refresh}
                    onError={(message) => setStatus({ type: 'error', message })}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />

      {confirmation && (
        <ConfirmDialog isDark={isDark} {...confirmation} onCancel={() => setConfirmation(null)} />
      )}
    </div>
  );
}

function StoryCard({
  story,
  contestName,
  isDark,
  isAdmin,
  busy,
  expanded,
  onToggle,
  onTogglePublication,
  onToggleEvaluation,
  onDelete,
  onRated,
  onError,
}) {
  const [score, setScore] = useState(story.myRating ? String(story.myRating.score) : '');
  const [comment, setComment] = useState(story.myRating?.comment || '');
  const [saving, setSaving] = useState(false);

  const handleRate = async (event) => {
    event.preventDefault();

    const numeric = Number(score);
    if (!Number.isFinite(numeric) || numeric < CONTEST_MIN_SCORE || numeric > CONTEST_MAX_SCORE) {
      onError(`La nota debe estar entre ${CONTEST_MIN_SCORE.toFixed(1)} y ${CONTEST_MAX_SCORE.toFixed(1)}.`);
      return;
    }

    setSaving(true);
    try {
      await rateContestStory(story.id, { score: Math.round(numeric * 10) / 10, comment: comment.trim() });
      await onRated();
    } catch (error) {
      onError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const badge = story.isPublished
    ? isDark ? 'bg-emerald-950/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
    : story.status === 'calificado'
      ? isDark ? 'bg-sky-950/50 text-sky-300' : 'bg-sky-50 text-sky-700'
      : isDark ? 'bg-amber-950/50 text-amber-300' : 'bg-amber-50 text-amber-700';

  const actionButton = `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
    isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`;

  const inputClasses = `px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-[#5D4037]/20 focus:border-[#5D4037]'
  }`;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {story.imageUrl && <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge}`}>
              {CONTEST_STATUS_LABELS[story.status] || story.status}
            </span>
            {story.totalRatings > 0 && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${isDark ? 'text-amber-400' : 'text-[#5D4037]'}`}>
                <Star className="w-3.5 h-3.5 fill-current" />
                {formatScore(story.averageScore)} / {CONTEST_MAX_SCORE.toFixed(1)}
                <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  ({story.totalRatings} {story.totalRatings === 1 ? 'juez' : 'jueces'})
                </span>
              </span>
            )}
          </div>

          <p className={`font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{story.title}</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {`${contestName} · ${story.authorName} · ${(story.createdAt || '').slice(0, 10)}`}
          </p>
        </div>

        <button type="button" onClick={onToggle} className={actionButton}>
          {expanded ? 'Ocultar' : 'Leer y calificar'}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className={`border-t px-4 py-5 space-y-6 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          {story.imageUrl && (
            <img src={story.imageUrl} alt="" className="w-full max-h-72 object-cover rounded-xl" />
          )}

          <div className={`whitespace-pre-wrap font-serif text-sm leading-relaxed max-h-96 overflow-y-auto ${
            isDark ? 'text-gray-300' : 'text-gray-800'
          }`}>
            {story.content}
          </div>

          {/* Mi calificación */}
          <form onSubmit={handleRate} className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
              Mi calificación
            </p>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nota (0.0 – 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={CONTEST_MIN_SCORE}
                  max={CONTEST_MAX_SCORE}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className={`${inputClasses} w-24 tabular-nums`}
                  placeholder="4.5"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Comentario (interno)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                  className={`${inputClasses} w-full`}
                  placeholder="Buen manejo del ritmo, final flojo…"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#5D4037] hover:bg-[#4A302A] disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {story.myRating ? 'Actualizar' : 'Calificar'}
              </button>
            </div>
          </form>

          {/* Calificaciones del resto del jurado */}
          {story.ratings.length > 0 && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                Jurado ({story.ratings.length})
              </p>
              <div className="space-y-2">
                {story.ratings.map((rating) => (
                  <div
                    key={rating.id}
                    className={`flex flex-wrap items-start gap-3 rounded-lg px-3 py-2 text-sm ${
                      isDark ? 'bg-gray-800/60' : 'bg-gray-100'
                    }`}
                  >
                    <span className={`font-bold tabular-nums ${isDark ? 'text-amber-400' : 'text-[#5D4037]'}`}>
                      {formatScore(rating.score)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {rating.judgeName}
                      </p>
                      {rating.comment && (
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rating.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisiones */}
          <div className={`flex flex-wrap gap-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <button type="button" onClick={onTogglePublication} disabled={busy} className={actionButton}>
              {story.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {story.isPublished ? 'Retirar de la página pública' : 'Publicar en la página pública'}
            </button>

            <button type="button" onClick={onToggleEvaluation} disabled={busy} className={actionButton}>
              {story.evaluationClosed ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {story.evaluationClosed ? 'Reabrir evaluación' : 'Cerrar evaluación'}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                  isDark ? 'bg-rose-950/50 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ isDark, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full flex-shrink-0 ${isDark ? 'bg-amber-950/50' : 'bg-amber-50'}`}>
            <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#5D4037] hover:bg-[#4A302A]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useContext, useEffect, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Lock, PenLine, Star } from 'lucide-react';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import {
  CONTEST_MAX_SCORE,
  CONTEST_STATUS_LABELS,
  MAX_IMAGE_BYTES,
  formatBytes,
  getMyContestStory,
  submitContestStory,
  updateMyContestStory,
  uploadCoverWithProgress,
} from '../../services/api';

const MIN_CONTENT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 25000;
const MAX_TITLE_LENGTH = 140;

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

export default function CollaboratorConcurso() {
  const { isDark } = useContext(ThemeContext);
  const [story, setStory] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;

    getMyContestStory()
      .then((response) => {
        if (!active || !response.story) return;

        setStory(response.story);
        setTitle(response.story.title || '');
        setContent(response.story.content || '');
        setImagePreview(response.story.imageUrl || null);
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

  // Un cuento congelado por el jurado ya no se puede tocar.
  const isLocked = Boolean(story && (story.status === 'calificado' || story.isPublished));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : story?.imageUrl || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!title.trim()) {
      setStatus({ type: 'error', message: 'Ponle un título a tu cuento.' });
      return;
    }

    if (content.trim().length < MIN_CONTENT_LENGTH) {
      setStatus({
        type: 'error',
        message: `El cuento debe tener al menos ${MIN_CONTENT_LENGTH} caracteres (llevas ${content.trim().length}).`,
      });
      return;
    }

    if (content.trim().length > MAX_CONTENT_LENGTH) {
      setStatus({ type: 'error', message: `El cuento no puede superar los ${MAX_CONTENT_LENGTH} caracteres.` });
      return;
    }

    if (!story && !imageFile) {
      setStatus({ type: 'error', message: 'Sube una imagen para acompañar tu cuento.' });
      return;
    }

    if (imageFile) {
      if (!imageFile.type.startsWith('image/')) {
        setStatus({ type: 'error', message: 'El archivo debe ser una imagen.' });
        return;
      }
      if (imageFile.size > MAX_IMAGE_BYTES) {
        setStatus({
          type: 'error',
          message: `La imagen pesa ${formatBytes(imageFile.size)} y el límite es ${formatBytes(MAX_IMAGE_BYTES)}.`,
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = { title: title.trim(), content: content.trim() };

      if (imageFile) {
        setUploadProgress(0);
        const uploaded = await uploadCoverWithProgress(imageFile, setUploadProgress);
        payload.imageUrl = uploaded.url;
        payload.imagePublicId = uploaded.publicId;
      }

      const response = story
        ? await updateMyContestStory(story.id, payload)
        : await submitContestStory(payload);

      setStory(response.story);
      setImageFile(null);
      setImagePreview(response.story.imageUrl || null);
      setStatus({ type: 'success', message: response.message });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const inputClasses = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-[#5D4037]/20 focus:border-[#5D4037]'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 tracking-wider uppercase ${
    isDark ? 'text-gray-300' : 'text-[#5D4037]'
  }`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <main className="flex-1 px-4 sm:px-8 py-10 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
                Concurso de Cuento Corto
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Puedes inscribir un cuento. Mientras el jurado no cierre su evaluación, podrás editarlo.
              </p>
            </header>

            {loading ? (
              <div className={`flex items-center justify-center gap-3 py-20 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando…
              </div>
            ) : (
              <>
                {story && (
                  <div className={`mb-6 rounded-2xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Estado de tu cuento
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        story.isPublished
                          ? isDark ? 'bg-emerald-950/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                          : isDark ? 'bg-amber-950/50 text-amber-300' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {CONTEST_STATUS_LABELS[story.status] || story.status}
                      </span>
                    </div>

                    {story.isPublished && (
                      <p className={`mt-3 flex items-center gap-2 text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        El jurado publicó tu cuento en la página del concurso.
                      </p>
                    )}

                    {isLocked && !story.isPublished && (
                      <p className={`mt-3 flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Lock className="w-4 h-4" />
                        El jurado cerró la evaluación: tu cuento ya no se puede editar.
                      </p>
                    )}

                    {story.totalRatings > 0 ? (
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Calificación del jurado
                          </span>
                          <span className={`inline-flex items-center gap-1 text-sm font-bold ${isDark ? 'text-amber-400' : 'text-[#5D4037]'}`}>
                            <Star className="w-4 h-4 fill-current" />
                            {formatScore(story.averageScore)} / {CONTEST_MAX_SCORE.toFixed(1)}
                            <span className={`font-normal text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              ({story.totalRatings} {story.totalRatings === 1 ? 'juez' : 'jueces'})
                            </span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          {(story.ratings || []).map((rating) => (
                            <div
                              key={rating.id}
                              className={`flex flex-wrap items-start gap-3 rounded-lg px-3 py-2 ${
                                isDark ? 'bg-gray-800/60' : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span className={`font-bold tabular-nums text-sm ${isDark ? 'text-amber-400' : 'text-[#5D4037]'}`}>
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
                    ) : (
                      <p className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Todavía ningún juez ha calificado tu cuento.
                      </p>
                    )}
                  </div>
                )}

                {status && (
                  <div className={`mb-6 rounded-xl px-4 py-3 text-sm border ${
                    status.type === 'success'
                      ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {status.message}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                >
                  <fieldset disabled={isLocked || submitting} className="space-y-5 disabled:opacity-60">
                    <div>
                      <label className={labelClasses}>Título</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={MAX_TITLE_LENGTH}
                        placeholder="El último vallenato de mi abuelo"
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>
                        <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                        Imagen {story && '(dejar vacío para conservar la actual)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={`${inputClasses} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#5D4037] file:text-white`}
                      />
                      <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Imagen, máx. {formatBytes(MAX_IMAGE_BYTES)}
                      </p>

                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="mt-3 w-full aspect-[16/9] object-cover rounded-xl"
                        />
                      )}
                    </div>

                    <div>
                      <label className={labelClasses}>Tu cuento</label>
                      <textarea
                        rows={16}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={MAX_CONTENT_LENGTH}
                        placeholder="Escribe aquí tu cuento corto…"
                        className={`${inputClasses} font-serif leading-relaxed`}
                      />
                      <p className={`mt-1 text-xs tabular-nums ${
                        content.trim().length < MIN_CONTENT_LENGTH
                          ? isDark ? 'text-amber-400' : 'text-amber-700'
                          : isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {content.trim().length} / {MAX_CONTENT_LENGTH} caracteres
                        {content.trim().length < MIN_CONTENT_LENGTH && ` · mínimo ${MIN_CONTENT_LENGTH}`}
                      </p>
                    </div>

                    {submitting && imageFile && (
                      <div>
                        <div className={`flex justify-between text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span>Subiendo imagen</span>
                          <span className="tabular-nums">{uploadProgress}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-[#5D4037] transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5D4037] hover:bg-[#4A302A] disabled:opacity-50 transition-colors"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                      {submitting ? 'Guardando…' : story ? 'Guardar cambios' : 'Inscribir mi cuento'}
                    </button>
                  </fieldset>
                </form>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

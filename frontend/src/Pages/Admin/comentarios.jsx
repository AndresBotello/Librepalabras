import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import {
  REPORT_REASON_LABELS,
  getCommentReports,
  resolveCommentReport,
} from '../../services/api';

const FILTERS = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'removed', label: 'Eliminados' },
  { value: 'dismissed', label: 'Descartados' },
  { value: 'all', label: 'Todos' },
];

const STATUS_BADGES = {
  pending: { label: 'Pendiente', classes: 'bg-amber-500/10 text-amber-600' },
  removed: { label: 'Comentario eliminado', classes: 'bg-rose-500/10 text-rose-600' },
  dismissed: { label: 'Descartado', classes: 'bg-slate-500/10 text-slate-500' },
};

export default function AdminComentarios() {
  const { isDark } = useContext(ThemeContext);
  const { confirm } = useDialog();

  const [reports, setReports] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    load(filter);
  }, [filter]);

  const load = async (status) => {
    setLoading(true);

    try {
      const response = await getCommentReports(status);

      if (response.ok) {
        setReports(response.reports || []);
        setPendingCount(response.pendingCount || 0);
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (report, action) => {
    if (action === 'remove') {
      const confirmed = await confirm({
        title: 'Eliminar comentario',
        message: `Se eliminará de "${report.workTitle}" y se cerrarán todas sus denuncias. No se puede deshacer.`,
        detail: report.commentText,
        confirmLabel: 'Eliminar comentario',
        variant: 'danger',
      });

      if (!confirmed) return;
    }

    setResolvingId(report.id);
    setFeedback(null);

    try {
      const response = await resolveCommentReport(report.id, action);
      setFeedback({ type: 'success', text: response.message });

      // Se recarga en vez de tocar el estado local: eliminar un comentario
      // cierra también las demás denuncias sobre él, y esas están en la lista.
      await load(filter);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setResolvingId(null);
    }
  };

  const cardClass = isDark
    ? 'bg-slate-900/80 border-slate-800'
    : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className={`px-6 lg:px-10 py-8 border-b transition-colors ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-5xl mx-auto">
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                Moderación
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                Comentarios reportados
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {pendingCount > 0
                  ? `${pendingCount} reporte(s) esperando tu decisión.`
                  : 'No hay reportes pendientes.'}
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === item.value
                      ? 'bg-brand-700 text-white'
                      : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                  {item.value === 'pending' && pendingCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {feedback && (
              <div
                role="status"
                className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
                  feedback.type === 'success'
                    ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                    : isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`h-40 rounded-xl border animate-pulse ${cardClass}`} />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className={`rounded-xl border p-12 text-center ${cardClass}`}>
                <p className="text-4xl mb-3" aria-hidden="true">🎉</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {filter === 'pending'
                    ? 'No hay comentarios reportados pendientes.'
                    : 'No hay reportes en esta categoría.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isDark={isDark}
                    cardClass={cardClass}
                    busy={resolvingId === report.id}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function ReportCard({ report, isDark, cardClass, busy, onResolve }) {
  const badge = STATUS_BADGES[report.status] || STATUS_BADGES.pending;
  const isPending = report.status === 'pending';

  return (
    <article className={`rounded-xl border p-5 transition-colors ${cardClass}`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badge.classes}`}>
          {badge.label}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
        }`}>
          {REPORT_REASON_LABELS[report.reason] || report.reason}
        </span>
        <span className={`text-xs ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {new Date(report.createdAt).toLocaleString('es-CO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Copia del comentario guardada en el reporte: sigue disponible aunque
          el comentario original ya se haya eliminado. */}
      <blockquote className={`px-4 py-3 rounded-lg border-l-4 mb-4 ${
        isDark
          ? 'bg-slate-800/60 border-amber-600 text-slate-200'
          : 'bg-amber-50/60 border-amber-500 text-slate-800'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.commentText}</p>
        <footer className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          — {report.commentUserName}
        </footer>
      </blockquote>

      <dl className={`grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs mb-4 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <div className="flex gap-1.5">
          <dt className="font-semibold">Obra:</dt>
          <dd className="truncate">{report.workTitle}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-semibold">Reportado por:</dt>
          <dd className="truncate">{report.reporterName}</dd>
        </div>
      </dl>

      {isPending ? (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onResolve(report, 'remove')}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Procesando…' : 'Eliminar comentario'}
          </button>
          <button
            onClick={() => onResolve(report, 'dismiss')}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
              isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Descartar reporte
          </button>
          <a
            href={`/literature?work=${report.workId}`}
            target="_blank"
            rel="noreferrer"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-brand-700 hover:bg-slate-100'
            }`}
          >
            Ver en contexto ↗
          </a>
        </div>
      ) : (
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Resuelto el {new Date(report.resolvedAt).toLocaleString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
    </article>
  );
}

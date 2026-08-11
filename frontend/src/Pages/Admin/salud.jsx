import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import {
  clearErrorLogs,
  deleteOrphanFile,
  formatBytes,
  getSystemHealth,
} from '../../services/api';

const COLLECTION_LABELS = {
  users: 'Usuarios',
  literature: 'Obras literarias',
  contestStories: 'Cuentos de concurso',
  poliversia: 'Ediciones de Poleversia',
  promotionalBooks: 'Libros promocionales',
  notifications: 'Notificaciones',
  commentReports: 'Reportes de comentarios',
  invitations: 'Invitaciones',
};

export default function AdminSalud() {
  const { isDark } = useContext(ThemeContext);
  const { confirm } = useDialog();

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const response = await getSystemHealth();

      if (response.ok) {
        setHealth(response.health);
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearErrors = async () => {
    const confirmed = await confirm({
      title: 'Borrar el registro de errores',
      message: 'Se eliminarán todos los errores registrados. Esta acción no se puede deshacer.',
      confirmLabel: 'Borrar registro',
      variant: 'danger',
    });

    if (!confirmed) return;

    setBusy('errors');

    try {
      const response = await clearErrorLogs();
      setFeedback({ type: 'success', text: response.message });
      await load();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteOrphan = async (file) => {
    const confirmed = await confirm({
      title: 'Eliminar archivo de Cloudinary',
      message: 'El archivo se borrará definitivamente. Comprueba antes que de verdad no lo usa nadie.',
      detail: file.publicId,
      confirmLabel: 'Eliminar archivo',
      variant: 'danger',
    });

    if (!confirmed) return;

    setBusy(file.publicId);

    try {
      const response = await deleteOrphanFile(file.publicId, file.resourceType);
      setFeedback({ type: 'success', text: response.message });

      setHealth((prev) => ({
        ...prev,
        orphanFiles: {
          ...prev.orphanFiles,
          total: prev.orphanFiles.total - 1,
          totalBytes: prev.orphanFiles.totalBytes - file.bytes,
          items: prev.orphanFiles.items.filter((item) => item.publicId !== file.publicId),
        },
      }));
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const cardClass = `rounded-xl border p-6 transition-colors ${
    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
  }`;

  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

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
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                  Operación
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                  Estado del sistema
                </h1>
                <p className={`text-sm mt-1 ${mutedClass}`}>
                  {health?.checkedAt
                    ? `Última comprobación: ${new Date(health.checkedAt).toLocaleString('es-CO')}`
                    : 'Cuota, base de datos, errores y archivos huérfanos.'}
                </p>
              </div>

              <button
                onClick={load}
                disabled={loading}
                className="px-5 py-2 rounded-lg font-semibold text-sm bg-[#5D4037] text-white hover:bg-[#4A302A] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Comprobando…' : '↻ Actualizar'}
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 space-y-8">
            {feedback && (
              <div
                role="status"
                className={`px-4 py-3 rounded-lg text-sm font-medium ${
                  feedback.type === 'success'
                    ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                    : isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {loading || !health ? (
              <div className="space-y-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`h-48 rounded-xl border animate-pulse ${cardClass}`} />
                ))}
              </div>
            ) : (
              <>
                {/* Servicios conectados */}
                <section className={cardClass}>
                  <h2 className="text-lg font-bold mb-5">Servicios</h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(health.services).map(([key, service]) => (
                      <div
                        key={key}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg ${
                          isDark ? 'bg-slate-800/60' : 'bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                            service.ok ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{service.label}</p>
                          <p className={`text-xs mt-0.5 break-words ${mutedClass}`}>{service.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <dl className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t text-sm ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <Stat label="Node" value={health.runtime.nodeVersion} mutedClass={mutedClass} />
                    <Stat label="Entorno" value={health.runtime.environment} mutedClass={mutedClass} />
                    <Stat
                      label="En marcha"
                      value={formatUptime(health.runtime.uptimeSeconds)}
                      mutedClass={mutedClass}
                    />
                    <Stat
                      label="Memoria"
                      value={`${health.runtime.memoryUsedMb} MB`}
                      mutedClass={mutedClass}
                    />
                  </dl>
                </section>

                {/* Cloudinary */}
                <section className={cardClass}>
                  <h2 className="text-lg font-bold mb-1">Almacenamiento (Cloudinary)</h2>
                  <p className={`text-xs mb-5 ${mutedClass}`}>
                    Los créditos combinan almacenamiento, tráfico y transformaciones.
                  </p>

                  {!health.storage.ok ? (
                    <ErrorBox message={health.storage.message} detail={health.storage.error} isDark={isDark} />
                  ) : (
                    <>
                      {health.storage.creditsPercent !== null && (
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold">
                              {health.storage.creditsUsed} de {health.storage.creditsLimit} créditos
                            </span>
                            <span className={mutedClass}>{health.storage.creditsPercent}%</span>
                          </div>
                          <div className={`w-full h-2.5 rounded-full overflow-hidden ${
                            isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                health.storage.creditsPercent > 80
                                  ? 'bg-rose-500'
                                  : health.storage.creditsPercent > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(health.storage.creditsPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <Stat label="Plan" value={health.storage.plan} mutedClass={mutedClass} />
                        <Stat label="Almacenado" value={formatBytes(health.storage.storageBytes)} mutedClass={mutedClass} />
                        <Stat label="Tráfico" value={formatBytes(health.storage.bandwidthBytes)} mutedClass={mutedClass} />
                        <Stat label="Archivos" value={health.storage.resourceCount} mutedClass={mutedClass} />
                      </dl>
                    </>
                  )}
                </section>

                {/* Base de datos */}
                <section className={cardClass}>
                  <h2 className="text-lg font-bold mb-5">Base de datos</h2>

                  {!health.database.ok ? (
                    <ErrorBox message={health.database.message} detail={health.database.error} isDark={isDark} />
                  ) : (
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {Object.entries(health.database.collections).map(([name, count]) => (
                        <Stat
                          key={name}
                          label={COLLECTION_LABELS[name] || name}
                          value={count.toLocaleString('es-CO')}
                          mutedClass={mutedClass}
                        />
                      ))}
                    </dl>
                  )}
                </section>

                {/* Errores */}
                <section className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-lg font-bold mb-1">Errores recientes</h2>
                      {health.errors.ok && (
                        <p className={`text-xs ${mutedClass}`}>
                          {health.errors.last24h} en las últimas 24 h · {health.errors.last7d} en 7 días
                        </p>
                      )}
                    </div>

                    {health.errors.ok && health.errors.recent.length > 0 && (
                      <button
                        onClick={handleClearErrors}
                        disabled={busy === 'errors'}
                        className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                          isDark ? 'text-rose-400 hover:bg-slate-800' : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        {busy === 'errors' ? 'Borrando…' : 'Limpiar registro'}
                      </button>
                    )}
                  </div>

                  {!health.errors.ok ? (
                    <ErrorBox message={health.errors.message} detail={health.errors.error} isDark={isDark} />
                  ) : health.errors.recent.length === 0 ? (
                    <p className={`text-sm py-6 text-center ${mutedClass}`}>
                      ✅ Sin errores registrados.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {health.errors.recent.map((error) => (
                        <li
                          key={error.id}
                          className={`px-4 py-3 rounded-lg text-sm ${isDark ? 'bg-slate-800/60' : 'bg-rose-50/60'}`}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {error.status}
                            </span>
                            <code className={`text-xs font-mono ${mutedClass}`}>
                              {error.method} {error.route}
                            </code>
                            <span className={`text-xs ml-auto ${mutedClass}`}>
                              {new Date(error.createdAt).toLocaleString('es-CO', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="font-medium break-words">{error.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Archivos huérfanos */}
                <section className={cardClass}>
                  <h2 className="text-lg font-bold mb-1">Archivos huérfanos</h2>
                  <p className={`text-xs mb-5 ${mutedClass}`}>
                    Están en Cloudinary pero ningún documento los referencia. Consumen cuota sin usarse.
                  </p>

                  {!health.orphanFiles.ok ? (
                    <ErrorBox message={health.orphanFiles.message} detail={health.orphanFiles.error} isDark={isDark} />
                  ) : health.orphanFiles.total === 0 ? (
                    <p className={`text-sm py-6 text-center ${mutedClass}`}>
                      ✅ No hay archivos huérfanos entre los {health.orphanFiles.scanned} revisados.
                    </p>
                  ) : (
                    <>
                      <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                        isDark ? 'bg-amber-950/40 text-amber-200' : 'bg-amber-50 text-amber-900'
                      }`}>
                        <strong>{health.orphanFiles.total} archivo(s)</strong> ocupando{' '}
                        <strong>{formatBytes(health.orphanFiles.totalBytes)}</strong>.
                        {health.orphanFiles.items.length < health.orphanFiles.total && (
                          <> Se listan los {health.orphanFiles.items.length} más pesados.</>
                        )}
                      </div>

                      <ul className="space-y-2">
                        {health.orphanFiles.items.map((file) => (
                          <li
                            key={file.publicId}
                            className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg ${
                              isDark ? 'bg-slate-800/60' : 'bg-slate-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono truncate">{file.publicId}</p>
                              <p className={`text-xs mt-0.5 ${mutedClass}`}>
                                {formatBytes(file.bytes)} · {file.format || file.resourceType} ·{' '}
                                {new Date(file.createdAt).toLocaleDateString('es-CO')}
                              </p>
                            </div>

                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                                isDark ? 'text-amber-400 hover:bg-slate-700' : 'text-[#5D4037] hover:bg-slate-200'
                              }`}
                            >
                              Ver ↗
                            </a>

                            <button
                              onClick={() => handleDeleteOrphan(file)}
                              disabled={busy === file.publicId}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                isDark ? 'text-rose-400 hover:bg-slate-700' : 'text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              {busy === file.publicId ? 'Borrando…' : 'Eliminar'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function Stat({ label, value, mutedClass }) {
  return (
    <div>
      <dt className={`text-xs uppercase tracking-wider font-medium ${mutedClass}`}>{label}</dt>
      <dd className="text-base font-bold mt-0.5 break-words">{value}</dd>
    </div>
  );
}

function ErrorBox({ message, detail, isDark }) {
  return (
    <div className={`px-4 py-3 rounded-lg text-sm ${
      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
    }`}>
      <p className="font-semibold">{message}</p>
      {detail && <p className="text-xs mt-1 opacity-75 break-words">{detail}</p>}
    </div>
  );
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;

  return `${Math.round(seconds / 86400)} d`;
}

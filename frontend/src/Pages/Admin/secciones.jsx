import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { deleteSectionWork, getAdminSectionWorks, reviewWork } from '../../services/api';
import { SECTIONS, editWorkPath, newWorkPath } from '../../config/sections';

const STATUS_BADGES = {
  approved: { label: 'Publicada', classes: 'bg-emerald-500/10 text-emerald-600' },
  pending_review: { label: 'Pendiente', classes: 'bg-amber-500/10 text-amber-600' },
  rejected: { label: 'Rechazada', classes: 'bg-rose-500/10 text-rose-500' },
};

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'pending_review', label: 'Pendientes' },
  { value: 'approved', label: 'Publicadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

/**
 * Gestión de "Los niños cuentan" y "Palabras sin dueños": lo publicado, lo
 * pendiente de revisión y lo rechazado, con aprobar, rechazar y eliminar. La
 * revisión usa el mismo endpoint que la moderación general.
 */
export default function AdminSecciones() {
  const { isDark } = useContext(ThemeContext);
  const { confirm, notify } = useDialog();

  const [sectionValue, setSectionValue] = useState('ninos');
  const [statusFilter, setStatusFilter] = useState('');
  // Igual que en la página pública: el resultado lleva la clave con la que se
  // pidió, y mientras no coincida con la actual la pantalla está cargando.
  const [result, setResult] = useState({ key: null, works: [] });
  const [reloadToken, setReloadToken] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const section = SECTIONS[sectionValue];
  const requestKey = `${sectionValue}:${reloadToken}`;

  useEffect(() => {
    let cancelled = false;

    getAdminSectionWorks(sectionValue)
      .then((response) => {
        if (!cancelled) setResult({ key: requestKey, works: response.works || [] });
      })
      .catch((err) => {
        if (cancelled) return;
        notify.error(err.message);
        setResult({ key: requestKey, works: [] });
      });

    return () => { cancelled = true; };
  }, [sectionValue, requestKey, notify]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const loading = result.key !== requestKey;
  const works = result.works.filter((work) => !statusFilter || work.status === statusFilter);

  const handleReview = async (work, status) => {
    setBusyId(work.id);

    try {
      await reviewWork(work.id, status);
      notify.success(status === 'approved' ? 'Obra publicada' : 'Obra rechazada');
      reload();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (work) => {
    const confirmed = await confirm({
      title: `¿Eliminar "${work.title}"?`,
      message: 'Se borra de la sección y su imagen se retira del almacenamiento.',
      detail: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) return;

    setBusyId(work.id);

    try {
      await deleteSectionWork(sectionValue, work.id);
      notify.success('Obra eliminada');
      reload();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const tab = (active) => `px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
    active
      ? 'bg-amber-500 border-amber-500 text-stone-950'
      : isDark
        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
  }`;

  const actionClass = `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
  }`;

  const kindOf = (value) => section.kinds.find((item) => item.value === value);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className={`px-6 lg:px-10 py-8 border-b ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-5xl mx-auto flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                  Comunidad
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">Niños y Palabras</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Gestiona lo publicado en “Los niños cuentan” y “Palabras sin dueños”.
                </p>
              </div>

              <Link
                to={newWorkPath(section)}
                className="px-5 py-2.5 rounded-full bg-amber-500 text-stone-950 text-sm font-bold hover:bg-amber-400 transition-colors"
              >
                Publicar en {section.label}
              </Link>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 space-y-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sección">
              {Object.values(SECTIONS).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={sectionValue === item.value}
                  className={tab(sectionValue === item.value)}
                  onClick={() => setSectionValue(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={statusFilter === item.value}
                  className={tab(statusFilter === item.value)}
                  onClick={() => setStatusFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading && <p className="py-12 text-center">Cargando…</p>}

            {!loading && works.length === 0 && (
              <p className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No hay obras con este filtro.
              </p>
            )}

            {!loading && works.length > 0 && (
              <ul className="space-y-3">
                {works.map((work) => {
                  const badge = STATUS_BADGES[work.status] || STATUS_BADGES.pending_review;
                  const kind = kindOf(work.kind);
                  const busy = busyId === work.id;

                  return (
                    <li
                      key={work.id}
                      className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      {work.cover ? (
                        <img src={work.cover} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-amber-500/10 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                          {kind?.emoji}
                        </div>
                      )}

                      <div className="flex-1 min-w-48">
                        <p className="font-semibold">{work.title}</p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {kind?.label} · {work.author}
                          {work.childAge ? `, ${work.childAge} años` : ''}
                          {' · '}
                          {new Date(work.createdAt).toLocaleDateString('es-CO')}
                        </p>
                        {work.authorEmail && work.status === 'pending_review' && (
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Enviado por {work.authorEmail}
                          </p>
                        )}
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.classes}`}>
                        {badge.label}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {work.status === 'approved' && (
                          <Link to={`${section.path}?obra=${encodeURIComponent(work.id)}`} className={actionClass}>
                            Ver
                          </Link>
                        )}
                        <Link to={editWorkPath(section, work.id)} className={actionClass}>
                          Editar
                        </Link>
                        {work.status !== 'approved' && (
                          <button type="button" disabled={busy} onClick={() => handleReview(work, 'approved')} className={actionClass}>
                            Aprobar
                          </button>
                        )}
                        {work.status === 'pending_review' && (
                          <button type="button" disabled={busy} onClick={() => handleReview(work, 'rejected')} className={actionClass}>
                            Rechazar
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(work)}
                          className={`${actionClass} text-rose-500`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

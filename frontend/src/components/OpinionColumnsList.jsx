import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  deleteOpinionColumn,
  getMyOpinionColumns,
  getOpinionColumns,
  reviewOpinionColumn,
} from '../services/api';
import { STATUS_OPTIONS, getStatusClasses } from '../utils/opinionColumnStatus';

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

function normalize(text = '') {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Todas las columnas en una lista compacta: una fila por columna, con buscador,
 * filtro por estado y paginación. Antes vivían en una tarjeta grande al lado del
 * formulario, y con decenas de columnas era casi imposible llegar al final.
 */
export default function OpinionColumnsList() {
  const { user } = useAuth();
  const { isDark } = useContext(ThemeContext);
  const isAdmin = user?.role === 'admin';
  const base = isAdmin ? '/admin/columnas' : '/collaborator/columnas';

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const loadColumns = async () => {
    try {
      const response = isAdmin
        ? await getOpinionColumns('', { summary: true })
        : await getMyOpinionColumns('', { summary: true });
      setColumns(response.columns || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar las columnas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadColumns();
  }, [user, isAdmin]);

  const filtered = useMemo(() => {
    const term = normalize(search.trim());

    return columns.filter((column) => {
      if (statusFilter !== 'all' && column.status !== statusFilter) return false;
      if (!term) return true;
      return normalize(`${column.title} ${column.subtitle} ${column.author}`).includes(term);
    });
  }, [columns, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleReview = async (id, nextStatus, notes = '') => {
    try {
      setError('');
      await reviewOpinionColumn(id, nextStatus, notes);
      setSuccess(nextStatus === 'published' ? 'Columna publicada' : nextStatus === 'rejected' ? 'Columna rechazada' : 'Se solicitaron cambios');
      await loadColumns();
    } catch (reviewError) {
      setError(reviewError.message || 'No se pudo actualizar el estado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta columna?')) return;

    try {
      setError('');
      await deleteOpinionColumn(id);
      setSuccess('Columna eliminada');
      await loadColumns();
    } catch (deleteError) {
      setError(deleteError.message || 'No se pudo eliminar la columna');
    }
  };

  const card = isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white';
  const input = isDark
    ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-amber-400'
    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-brand-500';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const pageButton = `rounded-full border px-4 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`;

  return (
    <section className={`min-w-0 overflow-hidden rounded-3xl border p-6 shadow-sm ${card} ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>Panel</p>
          <h2 className="mt-2 text-2xl font-bold">
            {isAdmin ? 'Columnas creadas' : 'Mis columnas'}
            {!loading && <span className={`ml-2 text-base font-medium ${muted}`}>({filtered.length})</span>}
          </h2>
        </div>
        <Link to={base} className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800">
          + Nueva columna
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Buscar por título, subtítulo o autor"
          className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${input}`}
        />
        <select
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
          className={`rounded-xl border px-3 py-2.5 text-sm outline-none sm:w-56 ${input}`}
        >
          <option value="all">Todos los estados</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {loading ? (
        <div className={`py-12 text-center text-sm ${muted}`}>Cargando columnas...</div>
      ) : visible.length === 0 ? (
        <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-50'} ${muted}`}>
          {columns.length === 0 ? 'Todavía no hay columnas.' : 'Ninguna columna coincide con la búsqueda.'}
        </div>
      ) : (
        <ul className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
          {visible.map((column) => (
            <li key={column.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
              {column.coverUrl ? (
                <img src={column.coverUrl} alt="" className="h-16 w-24 flex-shrink-0 rounded-lg object-cover" loading="lazy" />
              ) : (
                <div className={`h-16 w-24 flex-shrink-0 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${getStatusClasses(column.status)}`}>
                    {STATUS_OPTIONS.find((option) => option.value === column.status)?.label || column.status}
                  </span>
                  <span className={`text-[11px] uppercase tracking-[0.14em] ${muted}`}>{formatDate(column.publishedAt || column.updatedAt)}</span>
                </div>
                <h3 className="mt-1 truncate text-base font-bold">{column.title}</h3>
                <p className={`truncate text-sm ${muted}`}>
                  {column.author || 'Autor anónimo'}{column.subtitle ? ` · ${column.subtitle}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`${base}?editar=${column.id}`}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Editar
                </Link>
                {isAdmin && column.status !== 'published' && (
                  <button type="button" onClick={() => handleReview(column.id, 'published')} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                    {column.status === 'pending_review' ? 'Aprobar' : 'Publicar'}
                  </button>
                )}
                {isAdmin && column.status === 'pending_review' && (
                  <>
                    <button type="button" onClick={() => handleReview(column.id, 'rejected', 'Se rechaza por falta de rigor editorial.')} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                      Rechazar
                    </button>
                    <button type="button" onClick={() => handleReview(column.id, 'changes_requested', 'Necesita revisar estructura y tono editorial.')} className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                      Cambios
                    </button>
                  </>
                )}
                <button type="button" onClick={() => handleDelete(column.id)} className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" className={pageButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            ← Anterior
          </button>
          <span className={`text-sm ${muted}`}>Página {currentPage} de {totalPages}</span>
          <button type="button" className={pageButton} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}

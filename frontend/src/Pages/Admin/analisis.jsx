import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { ChartCard, DailyLine, DonutChart, MonthlyBars, RankedBars } from '../../components/AnalyticsCharts';
import { deleteAnalyticsComment, getWorkAnalyticsDetail, getWorksAnalytics } from '../../services/api';

/**
 * Colores del análisis. Cada métrica tiene el mismo color en toda la pantalla
 * (vistas = azul, comentarios = verde, "me gusta" = naranja) y la leyenda va
 * siempre al lado: el color nunca es el único camino a la identidad. Rejilla y
 * ejes son los mismos grises del dashboard.
 */
const COLORS = {
  light: {
    views: '#2878b0',
    comments: '#3fa03f',
    likes: '#c2571f',
    surface: '#ffffff',
    grid: '#e8eef2',
    axis: '#d0dce4',
    muted: '#5c7a91',
    slices: ['#3fa03f', '#2878b0', '#c2571f', '#8a5fb5', '#b8901a', '#8aa0b0'],
  },
  dark: {
    views: '#4295c8',
    comments: '#3fa03f',
    likes: '#e0894d',
    surface: '#2a343f',
    grid: '#3c4f60',
    axis: '#486176',
    muted: '#a9bdcb',
    slices: ['#3fa03f', '#4295c8', '#e0894d', '#b08ad6', '#d9b44a', '#6f8799'],
  },
};

const DAY_WINDOWS = [7, 30, 90];
const TOP_WORKS = 8;
// Porciones con nombre en la dona: más allá de cinco no se distinguen y la cola se agrupa.
const DONUT_WORKS = 5;

const RANK_METRICS = [
  { key: 'views', label: 'Vistas' },
  { key: 'likes', label: 'Me gusta' },
  { key: 'comments', label: 'Comentarios' },
];

const Icons = {
  Book: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Star: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

function capitalize(value) {
  const text = String(value || '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon: Icon, label, value, badge, badgeColor, isDark }) {
  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'}`}>
      <div className="flex items-center justify-between">
        <span className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
          <Icon />
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badgeColor}`}>{badge}</span>
      </div>
      <div className="mt-4">
        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function SkeletonCard({ isDark, className = 'h-72' }) {
  return <div className={`${className} rounded-xl border animate-pulse ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} />;
}

function Segmented({ options, value, onChange, isDark, label }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-lg p-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={option.key === value}
          onClick={() => onChange(option.key)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            option.key === value
              ? isDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-900 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const ratingRows = (distribution) => [5, 4, 3, 2, 1].map((score) => ({
  key: String(score),
  label: `${score} ${score === 1 ? 'estrella' : 'estrellas'}`,
  value: distribution[score] || 0,
}));

export default function AdminAnalisis() {
  const { isDark } = useContext(ThemeContext);
  const { confirm, notify } = useDialog();
  const palette = isDark ? COLORS.dark : COLORS.light;

  const [days, setDays] = useState(30);
  const [rankMetric, setRankMetric] = useState('views');
  const [commentsView, setCommentsView] = useState('obra');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRef = useRef(null);

  const [sort, setSort] = useState({ key: 'views', dir: 'desc' });

  useEffect(() => {
    let cancelled = false;

    getWorksAnalytics({ days })
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'No se pudo cargar el análisis.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days, reloadKey]);

  useEffect(() => {
    if (!selectedId) return undefined;

    let cancelled = false;

    getWorkAnalyticsDetail(selectedId, { days })
      .then((response) => {
        if (!cancelled) setDetail(response);
      })
      .catch((err) => {
        if (!cancelled) notify.error(err.message || 'No se pudo cargar la obra.');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, days, reloadKey, notify]);

  const handleDays = (value) => {
    setLoading(true);
    if (selectedId) setDetailLoading(true);
    setDays(value);
  };

  const handleSelectWork = (id) => {
    setDetail(null);
    setDetailLoading(true);
    setSelectedId(id);
    // Tras pintar el panel de detalle, se lleva a la vista: quien pulsa una obra
    // de la lista espera ver su detalle, no tener que buscarlo más abajo.
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleDeleteComment = async (comment) => {
    const confirmed = await confirm({
      title: 'Eliminar comentario',
      message: 'El comentario desaparecerá de la obra. No se puede deshacer.',
      detail: comment.text,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteAnalyticsComment(selectedId, comment.id);
      notify.success('Comentario eliminado.');
      setReloadKey((key) => key + 1);
    } catch (err) {
      notify.error(err.message || 'No se pudo eliminar el comentario.');
    }
  };

  const works = useMemo(() => data?.works || [], [data]);

  const sortedWorks = useMemo(() => {
    const factor = sort.dir === 'asc' ? 1 : -1;

    return [...works].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];

      if (typeof left === 'string') return factor * left.localeCompare(right, 'es');
      return factor * ((left || 0) - (right || 0));
    });
  }, [works, sort]);

  const topRows = useMemo(() => (
    [...works]
      .sort((a, b) => b[rankMetric] - a[rankMetric])
      .slice(0, TOP_WORKS)
      .map((work) => ({ key: work.id, label: work.title, value: work[rankMetric], hint: work.author }))
  ), [works, rankMetric]);

  // Reparto de los comentarios entre las obras que más tienen; el resto se
  // agrupa en "Otras" para que la dona no se llene de porciones diminutas.
  const commentSlices = useMemo(() => {
    const ranked = [...works].filter((work) => work.comments > 0).sort((a, b) => b.comments - a.comments);
    const head = ranked.slice(0, DONUT_WORKS).map((work) => ({ key: work.id, label: work.title, value: work.comments }));
    const rest = ranked.slice(DONUT_WORKS).reduce((sum, work) => sum + work.comments, 0);

    return rest > 0 ? [...head, { key: 'otras', label: 'Otras obras', value: rest, selectable: false }] : head;
  }, [works]);

  const genreRows = useMemo(() => (
    [...(data?.genres || [])]
      .sort((a, b) => b[rankMetric] - a[rankMetric])
      .map((item) => ({ key: item.genre, label: capitalize(item.genre), value: item[rankMetric], hint: `${item.works} ${item.works === 1 ? 'obra' : 'obras'}` }))
  ), [data, rankMetric]);

  const toggleSort = (key) => {
    setSort((current) => (
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: typeof works[0]?.[key] === 'string' ? 'asc' : 'desc' }
    ));
  };

  const totals = data?.totals;
  const dailyMetrics = [
    { key: 'views', label: 'Vistas', color: palette.views },
    { key: 'likes', label: 'Me gusta', color: palette.likes },
  ];

  const sortHeader = (key, label, align = 'right') => (
    <th
      className={`py-3 px-3 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}
      aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:underline">
        {label}
        <span aria-hidden="true" className="text-[10px]">{sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className={`px-6 lg:px-10 py-8 border-b transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Administración
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Análisis de Obras</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Vistas, “me gusta”, comentarios y calificaciones de las obras publicadas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  label="Periodo"
                  isDark={isDark}
                  value={days}
                  onChange={handleDays}
                  options={DAY_WINDOWS.map((value) => ({ key: value, label: `${value} días` }))}
                />
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-8">
            {error && (
              <p role="alert" className={`text-sm px-4 py-3 rounded-lg ${isDark ? 'bg-rose-950/50 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {loading || !totals
                ? Array(5).fill(0).map((_, index) => <SkeletonCard key={index} isDark={isDark} className="h-32" />)
                : (
                  <>
                    <StatCard isDark={isDark} icon={Icons.Book} label="Obras publicadas" value={totals.works.toLocaleString('es-CO')} badge="Aprobadas" badgeColor="bg-emerald-500/10 text-emerald-500" />
                    <StatCard isDark={isDark} icon={Icons.Eye} label="Vistas" value={totals.views.toLocaleString('es-CO')} badge={totals.works ? `${Math.round(totals.views / totals.works)} por obra` : '—'} badgeColor="bg-blue-500/10 text-blue-500" />
                    <StatCard isDark={isDark} icon={Icons.Heart} label="Me gusta" value={totals.likes.toLocaleString('es-CO')} badge={totals.works ? `${(totals.likes / totals.works).toFixed(1)} por obra` : '—'} badgeColor="bg-orange-500/10 text-orange-500" />
                    <StatCard isDark={isDark} icon={Icons.Chat} label="Comentarios" value={totals.comments.toLocaleString('es-CO')} badge={totals.works ? `${(totals.comments / totals.works).toFixed(1)} por obra` : '—'} badgeColor="bg-emerald-500/10 text-emerald-500" />
                    <StatCard isDark={isDark} icon={Icons.Star} label="Calificación" value={totals.ratings ? `${totals.averageRating.toFixed(1)} / 5` : '—'} badge={`${totals.ratings} ${totals.ratings === 1 ? 'nota' : 'notas'}`} badgeColor="bg-amber-500/10 text-amber-500" />
                  </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {loading || !data ? (
                <>
                  <SkeletonCard isDark={isDark} className="h-80 lg:col-span-2" />
                  <SkeletonCard isDark={isDark} className="h-80" />
                </>
              ) : (
                <>
                  <ChartCard
                    isDark={isDark}
                    className="lg:col-span-2"
                    title="Comentarios"
                    subtitle={commentsView === 'obra'
                      ? 'Cómo se reparten los comentarios entre las obras. Pulsa una para ver su detalle'
                      : 'Últimos 12 meses, según la fecha en que se escribió cada comentario'}
                    aside={(
                      <Segmented
                        label="Vista de comentarios"
                        isDark={isDark}
                        value={commentsView}
                        onChange={setCommentsView}
                        options={[{ key: 'obra', label: 'Por obra' }, { key: 'mes', label: 'Por mes' }]}
                      />
                    )}
                  >
                    {commentsView === 'obra' ? (
                      <DonutChart
                        slices={commentSlices}
                        colors={palette.slices}
                        palette={palette}
                        isDark={isDark}
                        centerLabel="Comentarios"
                        onSelect={handleSelectWork}
                        emptyText="Todavía no hay comentarios."
                      />
                    ) : (
                      <MonthlyBars
                        data={data.commentsByMonth.map((item) => ({ ...item, value: item.comments }))}
                        color={palette.comments}
                        label="Comentarios"
                        palette={palette}
                        isDark={isDark}
                        emptyText="No hay comentarios en los últimos 12 meses."
                      />
                    )}
                  </ChartCard>

                  <ChartCard isDark={isDark} title="Calificaciones" subtitle="Cuántas notas de cada valor han dejado los lectores">
                    <RankedBars rows={ratingRows(data.ratingDistribution)} color={palette.likes} isDark={isDark} emptyText="Todavía no hay calificaciones." />
                  </ChartCard>
                </>
              )}
            </div>

            {loading || !data ? (
              <SkeletonCard isDark={isDark} className="h-80" />
            ) : (
              <ChartCard
                isDark={isDark}
                title="Actividad diaria"
                subtitle={`Vistas y “me gusta” recibidos por día en los últimos ${data.daily.days} días`}
              >
                <DailyLine series={data.daily.series} metrics={dailyMetrics} palette={palette} isDark={isDark} trackingSince={data.daily.trackingSince} />
              </ChartCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {loading || !data ? (
                <>
                  <SkeletonCard isDark={isDark} />
                  <SkeletonCard isDark={isDark} />
                </>
              ) : (
                <>
                  <ChartCard
                    isDark={isDark}
                    title="Obras con más interacción"
                    subtitle="Pulsa una obra para ver su detalle"
                    aside={<Segmented label="Métrica" isDark={isDark} value={rankMetric} onChange={setRankMetric} options={RANK_METRICS} />}
                  >
                    <RankedBars rows={topRows} color={palette[rankMetric]} isDark={isDark} onSelect={handleSelectWork} emptyText="Todavía no hay interacción en las obras." />
                  </ChartCard>

                  <ChartCard isDark={isDark} title="Interacción por género" subtitle="Misma métrica que la lista de al lado, sumada por categoría literaria">
                    <RankedBars rows={genreRows} color={palette[rankMetric]} isDark={isDark} emptyText="Sin datos por género todavía." />
                  </ChartCard>
                </>
              )}
            </div>

            {(selectedId || detailLoading) && (
              <section ref={detailRef} aria-live="polite" className={`p-6 rounded-xl border scroll-mt-6 ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-brand-200'}`}>
                {detailLoading || !detail ? (
                  <div className="h-48 animate-pulse rounded-lg bg-slate-500/10" />
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                      <div className="min-w-0">
                        <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Detalle de la obra
                        </span>
                        <h2 className="text-xl font-extrabold mt-2 break-words">{detail.work.title}</h2>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {detail.work.author} · {capitalize(detail.work.genre)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedId(null); setDetail(null); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                      >
                        Cerrar
                      </button>
                    </div>

                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                      {[
                        ['Vistas', detail.work.views],
                        ['Me gusta', detail.work.likes],
                        ['Comentarios', detail.work.comments],
                        ['Calificación', detail.work.ratings ? `${detail.work.averageRating.toFixed(1)} / 5` : '—'],
                      ].map(([label, value]) => (
                        <div key={label} className={`rounded-lg p-4 ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                          <dt className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</dt>
                          <dd className="text-xl font-bold mt-1 tabular-nums">{typeof value === 'number' ? value.toLocaleString('es-CO') : value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <h3 className="text-sm font-bold mb-3">Actividad diaria</h3>
                        <DailyLine series={detail.daily.series} metrics={dailyMetrics} palette={palette} isDark={isDark} trackingSince={detail.daily.trackingSince} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold mb-3">Calificaciones</h3>
                        <RankedBars rows={ratingRows(detail.ratingDistribution)} color={palette.likes} isDark={isDark} emptyText="Sin calificaciones." />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold mt-8 mb-3">Comentarios ({detail.comments.length})</h3>
                    {detail.comments.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-500">Esta obra todavía no tiene comentarios.</p>
                    ) : (
                      <ul className="space-y-3">
                        {detail.comments.map((comment) => (
                          <li key={comment.id} className={`rounded-lg border p-4 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">{comment.userName}</p>
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                  {formatDateTime(comment.createdAt)} · {comment.likesCount} {comment.likesCount === 1 ? 'me gusta' : 'me gusta'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment)}
                                className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${isDark ? 'bg-red-900/60 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                              >
                                Eliminar
                              </button>
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{comment.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className={`xl:col-span-2 rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="p-6 pb-3">
                  <h3 className="text-base font-bold">Todas las obras</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ordena por cualquier columna y pulsa una obra para ver su detalle</p>
                </div>

                {loading ? (
                  <div className="h-48 m-6 mt-2 rounded animate-pulse bg-slate-500/10" />
                ) : sortedWorks.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-500">No hay obras publicadas con este filtro.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`text-xs border-y ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>
                          {sortHeader('title', 'Obra', 'left')}
                          {sortHeader('author', 'Autor', 'left')}
                          {sortHeader('views', 'Vistas')}
                          {sortHeader('likes', 'Me gusta')}
                          {sortHeader('comments', 'Coment.')}
                          {sortHeader('averageRating', 'Nota')}
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {sortedWorks.map((work) => (
                          <tr
                            key={work.id}
                            className={`border-b last:border-b-0 ${isDark ? 'border-slate-800' : 'border-slate-100'} ${selectedId === work.id ? (isDark ? 'bg-slate-800/60' : 'bg-brand-50') : ''}`}
                          >
                            <td className="py-2.5 px-3 max-w-[16rem]">
                              <button type="button" onClick={() => handleSelectWork(work.id)} className="block max-w-full truncate text-left font-semibold hover:underline">
                                {work.title}
                              </button>
                            </td>
                            <td className={`py-2.5 px-3 truncate max-w-[10rem] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{work.author}</td>
                            <td className="py-2.5 px-3 text-right">{work.views.toLocaleString('es-CO')}</td>
                            <td className="py-2.5 px-3 text-right">{work.likes}</td>
                            <td className="py-2.5 px-3 text-right">{work.comments}</td>
                            <td className="py-2.5 px-3 text-right">{work.ratings ? work.averageRating.toFixed(1) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <h3 className="text-base font-bold mb-1">Comentarios recientes</h3>
                <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lo último que han dicho los lectores</p>

                {loading ? (
                  <div className="space-y-4">
                    {Array(4).fill(0).map((_, index) => <div key={index} className="h-16 rounded animate-pulse bg-slate-500/10" />)}
                  </div>
                ) : (data?.recentComments || []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Sin comentarios todavía.</p>
                ) : (
                  <ul className="space-y-4">
                    {data.recentComments.map((comment) => (
                      <li key={comment.commentId}>
                        <button type="button" onClick={() => handleSelectWork(comment.workId)} className="block w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                          <p className="text-xs font-semibold truncate">
                            {comment.userName}
                            <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}> · {comment.workTitle}</span>
                          </p>
                          <p className={`text-sm mt-0.5 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{comment.text}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(comment.createdAt)}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

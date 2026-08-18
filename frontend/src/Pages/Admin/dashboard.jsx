import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getAllUsers, getPendingWorks, getApprovedWorks } from '../../services/api';

/**
 * Colores de las gráficas.
 *
 * Solo dos tonos, y significan lo mismo en toda la pantalla: verde = obra
 * aprobada, azul = obra pendiente de revisar. Salen de la paleta del proyecto
 * (`--color-emerald-500` y la rampa `brand`), y el par está comprobado contra
 * las dos superficies reales de la tarjeta: separación suficiente bajo
 * daltonismo protán y deután, y contraste ≥ 3:1 sobre el fondo. El ámbar que
 * pedía la intuición para "pendiente" no pasaba ninguna de las dos cosas.
 *
 * Los grises son los de la rampa `gray` del tema, un paso por encima del fondo
 * para que la rejilla no compita con los datos.
 */
const CHART_COLORS = {
  light: {
    approved: '#3fa03f',
    pending: '#2878b0',
    surface: '#ffffff',
    grid: '#e8eef2',
    axis: '#d0dce4',
    muted: '#5c7a91',
  },
  dark: {
    approved: '#3fa03f',
    pending: '#4295c8',
    surface: '#2a343f',
    grid: '#3c4f60',
    axis: '#486176',
    muted: '#a9bdcb',
  },
};

const MONTHS_SHOWN = 12;

// Tope del backend por petición. El dashboard pide el máximo para que la
// gráfica cubra lo más posible, y avisa cuando se queda corta.
const WORKS_FETCH_LIMIT = 100;

// Iconos SVG reutilizables
const Icons = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Pen: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Book: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  UserAdd: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Inbox: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0h-4l-1 2h-4l-1-2H4m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5" />
    </svg>
  ),
};

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Los doce meses hasta hoy, con las obras repartidas por el mes en que se
 * subieron. El color dirá en qué estado están ahora, pero la posición en el eje
 * es siempre la fecha de subida: mezclar las dos fechas haría que el eje
 * significara dos cosas distintas según la barra.
 */
function buildMonthlySeries(approvedWorks, pendingWorks) {
  const now = new Date();
  const buckets = [];

  for (let offset = MONTHS_SHOWN - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      year: date.getFullYear(),
      month: date.getMonth(),
      approved: 0,
      pending: 0,
    });
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const place = (works, field) => {
    works.forEach((work) => {
      const date = parseDate(work.createdAt);
      if (!date) return;

      const bucket = byKey.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (bucket) bucket[field] += 1;
    });
  };

  place(approvedWorks, 'approved');
  place(pendingWorks, 'pending');

  return buckets.map((bucket) => ({ ...bucket, total: bucket.approved + bucket.pending }));
}

/** Tope redondo (1, 2 o 5 por potencia de diez) para que las marcas del eje sean legibles. */
function niceScale(maxValue) {
  if (maxValue <= 0) return { top: 1, ticks: [0, 1] };

  const rough = maxValue / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough)
    || 10 * magnitude;

  const top = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let value = 0; value <= top + 1e-9; value += step) ticks.push(Math.round(value));

  return { top, ticks };
}

/** Barra con las esquinas de arriba redondeadas y la base recta, apoyada en el eje. */
function topRoundedPath(x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height));

  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}

function relativeTime(value) {
  const date = parseDate(value);
  if (!date) return '';

  const elapsed = Date.now() - date.getTime();
  if (elapsed < 0) return 'ahora mismo';

  const minutes = Math.round(elapsed / 60000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? 'ayer' : `hace ${days} días`;

  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Un único hilo de sucesos ordenado por fecha, no dos listas pegadas.
 *
 * Antes se cogían las tres primeras obras y los dos primeros usuarios que
 * devolvía la API y se concatenaban: los usuarios no venían ordenados por
 * fecha, así que salían dos cualesquiera, y siempre en el mismo hueco de la
 * lista. Aquí cada suceso lleva su fecha, se descarta el que no la tenga y se
 * ordena todo junto.
 */
function buildActivity({ approvedWorks, pendingWorks, users }) {
  const events = [];

  approvedWorks.forEach((work) => {
    // `updatedAt` es cuando se aprobó (lo escribe la moderación); `createdAt`,
    // cuando se subió. El suceso que se cuenta aquí es la aprobación.
    const at = work.updatedAt || work.createdAt;
    if (!parseDate(at)) return;

    events.push({
      at,
      type: 'approved',
      name: work.author || 'Anónimo',
      action: `Se publicó "${work.title}"`,
    });
  });

  pendingWorks.forEach((work) => {
    if (!parseDate(work.createdAt)) return;

    events.push({
      at: work.createdAt,
      type: 'pending',
      name: work.author || 'Anónimo',
      action: `Subió "${work.title}", pendiente de revisión`,
    });
  });

  users.forEach((user) => {
    if (!parseDate(user.createdAt)) return;

    events.push({
      at: user.createdAt,
      type: 'user',
      name: user.name || user.nombres || 'Usuario nuevo',
      action: 'Se unió a la plataforma',
    });
  });

  return events
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 7);
}

export default function Admin() {
  const { isDark } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [genreStats, setGenreStats] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [coverage, setCoverage] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, approvedRes] = await Promise.all([
        getAllUsers(),
        getPendingWorks('pending_review', { limit: WORKS_FETCH_LIMIT }),
        getApprovedWorks('', { limit: WORKS_FETCH_LIMIT }),
      ]);

      const users = usersRes.users || [];
      const pendingWorks = pendingRes.works || [];
      const approvedWorks = approvedRes.works || [];

      const totalUsers = users.length;
      const collaborators = users.filter(u => u.role === 'collaborator').length;

      // Los totales vienen del backend, no del largo de la lista: la lista
      // llega recortada al límite de la petición y contarla daba un techo falso.
      const approvedTotal = approvedRes.total ?? approvedWorks.length;
      const pendingTotal = pendingRes.total ?? pendingWorks.length;

      // Calculo seguro del porcentaje
      const colabPercentage = totalUsers > 0 ? Math.round((collaborators / totalUsers) * 100) : 0;

      setStats([
        {
          label: 'Usuarios Totales',
          value: totalUsers.toLocaleString(),
          icon: Icons.Users,
          badge: `${collaborators} colaboradores`,
          badgeColor: 'bg-blue-500/10 text-blue-500',
        },
        {
          label: 'Publicaciones Aprobadas',
          value: approvedTotal.toLocaleString(),
          icon: Icons.Document,
          badge: 'Obras públicas',
          badgeColor: 'bg-emerald-500/10 text-emerald-500',
        },
        {
          label: 'Solicitudes Pendientes',
          value: pendingTotal.toLocaleString(),
          icon: Icons.Clock,
          badge: pendingTotal > 0 ? `${pendingTotal} por revisar` : 'Al día',
          badgeColor: pendingTotal > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500',
        },
        {
          label: 'Colaboradores Activos',
          value: collaborators.toLocaleString(),
          icon: Icons.Pen,
          badge: `${colabPercentage}% del total`,
          badgeColor: 'bg-brand-500/10 text-brand-500',
        },
      ]);

      setMonthly(buildMonthlySeries(approvedWorks, pendingWorks));
      setRecentActivity(buildActivity({ approvedWorks, pendingWorks, users }));

      // Si el backend tenía más obras de las que cupieron en la petición, la
      // gráfica no las está contando y hay que decirlo.
      const fetched = approvedWorks.length + pendingWorks.length;
      const available = approvedTotal + pendingTotal;
      setCoverage(available > fetched ? { fetched, available } : null);

      const genreCounts = {};
      approvedWorks.forEach(work => {
        const genre = work.genre || 'Otros';
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
      setGenreStats(genreCounts);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const palette = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto">
          {/* Header Dashboard */}
          <div className={`px-6 lg:px-10 py-8 border-b transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Administración
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Panel de Control</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Monitorea la actividad, moderación de obras y métricas globales de Liberapalabras.
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {loading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className={`h-32 rounded-xl p-5 border animate-pulse ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} />
                  ))
                : stats.map((stat, idx) => {
                    const IconComponent = stat.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${
                          isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                            <IconComponent />
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${stat.badgeColor}`}>
                            {stat.badge}
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {stat.label}
                          </p>
                          <p className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <MonthlyWorksChart
                loading={loading}
                data={monthly}
                palette={palette}
                isDark={isDark}
                coverage={coverage}
              />

              <RecentActivity loading={loading} events={recentActivity} isDark={isDark} />
            </div>

            <GenreDistribution
              loading={loading}
              genreStats={genreStats}
              palette={palette}
              isDark={isDark}
            />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

const PLOT = {
  width: 760,
  height: 260,
  padTop: 18,
  padRight: 10,
  padBottom: 30,
  padLeft: 38,
};

/**
 * Obras recibidas por mes, apiladas por el estado en que están hoy.
 *
 * Va en SVG a mano y no con una librería de gráficas: son doce columnas y dos
 * series, y meter una dependencia de varios cientos de KB en el bundle para
 * esto no sale a cuenta.
 */
function MonthlyWorksChart({ loading, data, palette, isDark, coverage }) {
  const [hovered, setHovered] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const plotWidth = PLOT.width - PLOT.padLeft - PLOT.padRight;
  const plotHeight = PLOT.height - PLOT.padTop - PLOT.padBottom;

  const maxTotal = data.reduce((max, item) => Math.max(max, item.total), 0);
  const scale = niceScale(maxTotal);

  const band = plotWidth / Math.max(data.length, 1);
  const columnWidth = Math.min(24, band * 0.62);

  const yOf = (value) => PLOT.padTop + plotHeight - (value / scale.top) * plotHeight;
  const xOf = (index) => PLOT.padLeft + band * index + (band - columnWidth) / 2;

  const totalPeriod = data.reduce((sum, item) => sum + item.total, 0);
  const busiest = data.reduce((best, item) => (item.total > (best?.total || 0) ? item : best), null);

  const cardClasses = `lg:col-span-2 p-6 rounded-xl border ${
    isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'
  }`;

  const legend = [
    { key: 'approved', label: 'Aprobadas', color: palette.approved },
    { key: 'pending', label: 'Pendientes', color: palette.pending },
  ];

  return (
    <div className={cardClasses}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold">Obras recibidas por mes</h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Últimos 12 meses, según el mes en que se subieron y el estado que tienen hoy
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {totalPeriod} en el periodo
          </span>
          <button
            type="button"
            onClick={() => setShowTable((previous) => !previous)}
            className={`text-xs font-semibold underline underline-offset-4 transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {showTable ? 'Ver gráfica' : 'Ver tabla'}
          </button>
        </div>
      </div>

      {/* La leyenda va siempre: el color nunca es el único camino a la identidad. */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {legend.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2 text-xs font-medium">
            <span
              aria-hidden="true"
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{item.label}</span>
          </span>
        ))}
      </div>

      {loading ? (
        <div className={`h-64 rounded-lg animate-pulse ${isDark ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
      ) : totalPeriod === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No hay obras registradas en los últimos 12 meses.
        </div>
      ) : showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <th className="py-2 pr-4 font-semibold">Mes</th>
                <th className="py-2 pr-4 font-semibold text-right">Aprobadas</th>
                <th className="py-2 pr-4 font-semibold text-right">Pendientes</th>
                <th className="py-2 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((item) => (
                <tr key={item.key} className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <td className="py-1.5 pr-4">{`${MONTH_LABELS[item.month]} ${item.year}`}</td>
                  <td className="py-1.5 pr-4 text-right">{item.approved}</td>
                  <td className="py-1.5 pr-4 text-right">{item.pending}</td>
                  <td className="py-1.5 text-right font-semibold">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Obras recibidas por mes durante los últimos 12 meses. ${totalPeriod} obras en total.`}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Rejilla: línea sólida de un paso sobre el fondo, nunca discontinua. */}
            {scale.ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PLOT.padLeft}
                  x2={PLOT.width - PLOT.padRight}
                  y1={yOf(tick)}
                  y2={yOf(tick)}
                  stroke={tick === 0 ? palette.axis : palette.grid}
                  strokeWidth="1"
                />
                <text
                  x={PLOT.padLeft - 8}
                  y={yOf(tick) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={palette.muted}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {tick}
                </text>
              </g>
            ))}

            {data.map((item, index) => {
              const x = xOf(index);
              const isHovered = hovered === index;

              // Hueco de 2 px del color del fondo entre los dos tramos: es el
              // fondo el que separa, no un borde dibujado alrededor.
              const gap = item.approved > 0 && item.pending > 0 ? 2 : 0;
              const approvedHeight = (item.approved / scale.top) * plotHeight;
              const pendingHeight = (item.pending / scale.top) * plotHeight;

              const baseY = PLOT.padTop + plotHeight;
              const approvedY = baseY - approvedHeight;
              const pendingY = approvedY - gap - pendingHeight;

              return (
                <g key={item.key}>
                  {item.approved > 0 && (
                    item.pending > 0 ? (
                      <rect
                        x={x}
                        y={approvedY}
                        width={columnWidth}
                        height={approvedHeight}
                        fill={palette.approved}
                        opacity={hovered === null || isHovered ? 1 : 0.55}
                      />
                    ) : (
                      <path
                        d={topRoundedPath(x, approvedY, columnWidth, approvedHeight, 4)}
                        fill={palette.approved}
                        opacity={hovered === null || isHovered ? 1 : 0.55}
                      />
                    )
                  )}

                  {item.pending > 0 && (
                    <path
                      d={topRoundedPath(x, pendingY, columnWidth, pendingHeight, 4)}
                      fill={palette.pending}
                      opacity={hovered === null || isHovered ? 1 : 0.55}
                    />
                  )}

                  {/* Etiqueta directa solo en el mes más alto: un número sobre
                      cada columna no se lee, se ignora. */}
                  {busiest && busiest.key === item.key && item.total > 0 && (
                    <text
                      x={x + columnWidth / 2}
                      y={(item.pending > 0 ? pendingY : approvedY) - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill={palette.muted}
                    >
                      {item.total}
                    </text>
                  )}

                  <text
                    x={x + columnWidth / 2}
                    y={PLOT.height - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fill={palette.muted}
                  >
                    {MONTH_LABELS[item.month]}
                  </text>

                  {/* Zona sensible de banda completa: se apunta al mes, no a la
                      columna, que en meses flojos son cuatro píxeles. */}
                  <rect
                    x={PLOT.padLeft + band * index}
                    y={PLOT.padTop}
                    width={band}
                    height={plotHeight}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${MONTH_LABELS[item.month]} ${item.year}: ${item.approved} aprobadas, ${item.pending} pendientes`}
                    onMouseEnter={() => setHovered(index)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    style={{ cursor: 'default' }}
                  />
                </g>
              );
            })}
          </svg>

          {hovered !== null && data[hovered] && (() => {
            const anchorTop = (yOf(data[hovered].total) / PLOT.height) * 100;
            // Columna alta: no cabe encima, así que el globo cae por debajo de
            // la cima en vez de salirse de la tarjeta.
            const below = anchorTop < 35;

            return (
            <div
              className={`pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-lg ${
                below ? '' : '-translate-y-full'
              } ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
              style={{
                left: `${Math.min(88, Math.max(12, ((xOf(hovered) + columnWidth / 2) / PLOT.width) * 100))}%`,
                top: `${below ? anchorTop + 3 : anchorTop - 2}%`,
              }}
            >
              <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                {`${MONTH_LABELS[data[hovered].month]} ${data[hovered].year}`}
              </p>
              {legend.map((item) => (
                <p key={item.key} className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    aria-hidden="true"
                    className="w-3 h-0.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold tabular-nums">{data[hovered][item.key]}</span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{item.label}</span>
                </p>
              ))}
            </div>
            );
          })()}
        </div>
      )}

      {coverage && !loading && (
        <p className={`mt-4 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {`La gráfica cuenta las ${coverage.fetched} obras más recientes de ${coverage.available}: el resto queda fuera del límite de consulta.`}
        </p>
      )}
    </div>
  );
}

/**
 * Reparto por género de las obras aprobadas.
 *
 * Un solo color para todas las barras: los géneros no tienen orden natural, así
 * que pintarlos de tonos distintos gastaría el canal del color en repetir lo
 * que la longitud de la barra ya dice.
 */
function GenreDistribution({ loading, genreStats, palette, isDark }) {
  const MAX_ROWS = 7;

  const entries = Object.entries(genreStats).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  // Más allá de siete clases las barras cortas dejan de distinguirse: la cola
  // se agrupa en vez de alargar la lista.
  const head = entries.slice(0, MAX_ROWS);
  const tail = entries.slice(MAX_ROWS);
  const rows = tail.length > 0
    ? [...head, ['Otros', tail.reduce((sum, [, count]) => sum + count, 0)]]
    : head;

  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold">Distribución por Géneros</h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Proporción de publicaciones aprobadas según categoría literaria
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          {total} obras
        </span>
      </div>

      {loading ? (
        <div className="space-y-4 py-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className={`h-8 rounded animate-pulse ${isDark ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
          ))}
        </div>
      ) : rows.length > 0 ? (
        <div className="space-y-4">
          {rows.map(([genre, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={genre} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className={`capitalize ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{genre}</span>
                  <span className={`tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {count} ({pct}%)
                  </span>
                </div>
                <div className={`w-full h-2.5 rounded-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: palette.approved,
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-slate-500">
          No hay suficientes datos de géneros registrados.
        </div>
      )}
    </div>
  );
}

const ACTIVITY_STYLES = {
  approved: { Icon: Icons.Book, light: 'bg-emerald-500/10 text-emerald-600', dark: 'bg-emerald-500/10 text-emerald-400' },
  pending: { Icon: Icons.Inbox, light: 'bg-brand-500/10 text-brand-600', dark: 'bg-brand-500/10 text-brand-400' },
  user: { Icon: Icons.UserAdd, light: 'bg-blue-500/10 text-blue-600', dark: 'bg-blue-500/10 text-blue-400' },
};

function RecentActivity({ loading, events, isDark }) {
  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'}`}>
      <h3 className="text-base font-bold mb-1">Actividad Reciente</h3>
      <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Publicaciones, envíos y altas, de lo más nuevo a lo más viejo
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className={`h-12 rounded animate-pulse ${isDark ? 'bg-slate-800/40' : 'bg-slate-100'}`} />
          ))}
        </div>
      ) : events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((item, index) => {
            const style = ACTIVITY_STYLES[item.type] || ACTIVITY_STYLES.user;
            const ItemIcon = style.Icon;

            return (
              <li key={`${item.at}-${index}`} className="flex items-start gap-3 text-sm">
                <span className={`p-2 rounded-lg shrink-0 mt-0.5 ${isDark ? style.dark : style.light}`}>
                  <ItemIcon />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{item.name}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.action}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {relativeTime(item.at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="py-8 text-center text-sm text-slate-500">
          Sin registros recientes.
        </div>
      )}
    </div>
  );
}

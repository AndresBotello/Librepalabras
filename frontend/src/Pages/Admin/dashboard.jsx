import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getAllUsers, getPendingWorks, getApprovedWorks } from '../../services/api';

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
};

export default function Admin() {
  const { isDark } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [genreStats, setGenreStats] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, approvedRes] = await Promise.all([
        getAllUsers(),
        getPendingWorks(),
        getApprovedWorks(),
      ]);

      const totalUsers = usersRes.users?.length || 0;
      const collaborators = usersRes.users?.filter(u => u.role === 'collaborator').length || 0;
      const approvedWorks = approvedRes.works?.length || 0;
      const pendingWorks = pendingRes.works?.length || 0;

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
          value: approvedWorks.toLocaleString(),
          icon: Icons.Document,
          badge: 'Obras públicas',
          badgeColor: 'bg-emerald-500/10 text-emerald-500',
        },
        {
          label: 'Solicitudes Pendientes',
          value: pendingWorks.toLocaleString(),
          icon: Icons.Clock,
          badge: pendingWorks > 0 ? `${pendingWorks} por revisar` : 'Al día',
          badgeColor: pendingWorks > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500',
        },
        {
          label: 'Colaboradores Activos',
          value: collaborators.toLocaleString(),
          icon: Icons.Pen,
          badge: `${colabPercentage}% del total`,
          badgeColor: 'bg-brand-500/10 text-brand-500',
        },
      ]);

      const activities = [];

      if (approvedRes.works?.length > 0) {
        approvedRes.works.slice(0, 3).forEach(work => {
          activities.push({
            name: work.author || 'Anónimo',
            action: `Publicó "${work.title}"`,
            time: work.createdAt ? new Date(work.createdAt).toLocaleDateString('es-CO') : 'Hace poco',
            Icon: Icons.Book,
            type: 'work',
          });
        });
      }

      if (usersRes.users?.length > 0) {
        usersRes.users.slice(0, 2).forEach(user => {
          activities.push({
            name: user.nombres || 'Usuario nuevo',
            action: 'Se unió a la plataforma',
            time: user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO') : 'Hace poco',
            Icon: Icons.UserAdd,
            type: 'user',
          });
        });
      }

      setRecentActivity(activities);

      if (approvedRes.works?.length > 0) {
        const genreCounts = {};
        approvedRes.works.forEach(work => {
          const genre = work.genre || 'Otros';
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
        setGenreStats(genreCounts);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalWorksInGenres = Object.values(genreStats).reduce((a, b) => a + b, 0);

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
              {/* Horizontal Bar Chart Component */}
              <div className={`lg:col-span-2 p-6 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold">Distribución por Géneros</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Proporción de publicaciones según categoría literaria
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500">
                    {totalWorksInGenres} Obras Totales
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-4 py-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-8 bg-slate-800/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : Object.keys(genreStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(genreStats).map(([genre, count]) => {
                      const pct = totalWorksInGenres > 0 ? Math.round((count / totalWorksInGenres) * 100) : 0;
                      return (
                        <div key={genre} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{genre}</span>
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{count} ({pct}%)</span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
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

              {/* Recent Activity List */}
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <h3 className="text-base font-bold mb-1">Actividad Reciente</h3>
                <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Últimos eventos en el ecosistema
                </p>

                {loading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-12 bg-slate-800/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((item, index) => {
                      const ItemIcon = item.Icon;
                      return (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <span className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            item.type === 'work' 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            <ItemIcon />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs sm:text-sm truncate">{item.name}</p>
                            <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.action}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Sin registros recientes.
                  </div>
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

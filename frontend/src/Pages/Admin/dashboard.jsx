import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getAllUsers, getPendingWorks, getApprovedWorks } from '../../services/api';

export default function Admin() {
  const { isDark } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'USUARIOS TOTALES', value: '0', icon: '👥', trend: 'Cargando...' },
    { label: 'PUBLICACIONES APROBADAS', value: '0', icon: '📄', trend: 'Cargando...' },
    { label: 'SOLICITUDES PENDIENTES', value: '0', icon: '📋', trend: 'Cargando...' },
    { label: 'COLABORADORES ACTIVOS', value: '0', icon: '✍️', trend: 'Cargando...' },
  ]);
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

      setStats([
        {
          label: 'USUARIOS TOTALES',
          value: totalUsers.toLocaleString(),
          icon: '👥',
          trend: `${collaborators} colaboradores activos`,
        },
        {
          label: 'PUBLICACIONES APROBADAS',
          value: approvedWorks.toLocaleString(),
          icon: '📄',
          trend: `${approvedWorks} obras disponibles`,
        },
        {
          label: 'SOLICITUDES PENDIENTES',
          value: pendingWorks.toLocaleString(),
          icon: '📋',
          trend: pendingWorks > 0 ? `${pendingWorks} sin revisar` : 'Todo revisado ✓',
        },
        {
          label: 'COLABORADORES ACTIVOS',
          value: collaborators.toLocaleString(),
          icon: '✍️',
          trend: `${Math.round((collaborators / totalUsers) * 100)}% del total`,
        },
      ]);

      const activities = [];

      if (approvedRes.works && approvedRes.works.length > 0) {
        approvedRes.works.slice(0, 3).forEach(work => {
          activities.push({
            name: work.author || 'Anónimo',
            action: `publicó "${work.title}"`,
            time: work.createdAt ? new Date(work.createdAt).toLocaleDateString('es-CO') : 'Hace poco',
            icon: '📚',
          });
        });
      }

      if (usersRes.users && usersRes.users.length > 0) {
        usersRes.users.slice(0, 1).forEach(user => {
          activities.push({
            name: user.nombres || 'Usuario',
            action: 'se registró en la plataforma',
            time: user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO') : 'Hace poco',
            icon: '👤',
          });
        });
      }

      setRecentActivity(activities.length > 0 ? activities : [
        { name: 'Sin actividad', action: 'No hay datos disponibles', time: 'N/A', icon: '📭' },
      ]);

      // Calcular estadísticas por género
      if (approvedRes.works && approvedRes.works.length > 0) {
        const genreCounts = {};
        approvedRes.works.forEach(work => {
          const genre = work.genre || 'Otros';
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
        setGenreStats(genreCounts);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setRecentActivity([
        { name: 'Error', action: 'No se pudieron cargar los datos', time: 'N/A', icon: '⚠️' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Section */}
          <section className={`px-4 sm:px-8 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
            <div>
              <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Panel Administrativo
              </h1>
              <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl`}>
                Bienvenido, Administrador. Gestiona la moderación de contenidos, supervisa el crecimiento de la comunidad y cataloga archivos literarios de Liberapalabras.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
                📊 Exportar Reportes
              </button>
              <button className="px-5 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A]">
                ⚙️ Nueva Configuración
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                      {stat.label}
                    </p>
                    <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {stat.trend}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

          {/* Tabs Section */}
          <section className={`px-4 sm:px-8 py-10 flex-1 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`border-b transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex gap-8 overflow-x-auto">
              {['general', 'moderation', 'users', 'files'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 font-semibold text-sm whitespace-nowrap uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? isDark
                        ? 'text-yellow-400 border-b-2 border-yellow-400'
                        : 'text-yellow-600 border-b-2 border-yellow-600'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'general' && 'Vista General'}
                  {tab === 'moderation' && 'Moderación'}
                  {tab === 'users' && 'Usuarios'}
                  {tab === 'files' && 'Archivos'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className={`lg:col-span-2 rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Distribución por Géneros
                  </h3>
                  <p className={`text-sm mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cantidad de obras publicadas por cada género literario
                  </p>

                  {/* Gráfico de Géneros */}
                  <div className={`h-64 rounded-lg flex items-end justify-around gap-2 transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-4`}>
                    {loading ? (
                      <div className="w-full flex items-center justify-center">
                        <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Cargando datos...
                        </p>
                      </div>
                    ) : Object.keys(genreStats).length > 0 ? (
                      Object.entries(genreStats).map(([genre, count]) => {
                        const maxCount = Math.max(...Object.values(genreStats));
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={genre} className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-full flex flex-col items-center">
                              <div
                                className="bg-yellow-400 rounded w-full transition-all"
                                style={{ height: `${Math.max(20, percentage)}px` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 text-center truncate max-w-full">
                              {genre.substring(0, 8)}
                            </span>
                            <span className="text-xs font-semibold text-gray-700">{count}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full flex items-center justify-center">
                        <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No hay datos disponibles
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Actividad Reciente
                  </h3>
                  <p className={`text-sm mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Últimas acciones en la plataforma
                  </p>

                  <div className="space-y-4">
                    {loading ? (
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
                        Cargando actividad...
                      </p>
                    ) : recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className={`pb-4 ${index !== recentActivity.length - 1 ? (isDark ? 'border-b border-gray-800' : 'border-b border-gray-200') : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{activity.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                {activity.name}
                              </p>
                              <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'} truncate`}>
                                {activity.action}
                              </p>
                              <p className={`text-xs transition-colors ${isDark ? 'text-gray-600' : 'text-gray-500'} mt-1`}>
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
                        No hay actividad disponible
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} text-center py-12`}>
                <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Contenido de Moderación (próximamente)
                </p>
              </div>
            )}

            {activeTab === 'users' && (
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} text-center py-12`}>
                <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gestión de Usuarios (próximamente)
                </p>
              </div>
            )}

            {activeTab === 'files' && (
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} text-center py-12`}>
                <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gestión de Archivos (próximamente)
                </p>
              </div>
            )}
            </div>
          </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

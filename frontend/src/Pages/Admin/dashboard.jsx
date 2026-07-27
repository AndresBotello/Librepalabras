import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';

export default function Admin() {
  const { isDark } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('general');

  const stats = [
    { label: 'USUARIOS TOTALES', value: '12,482', icon: '👥', trend: '+12% mes pasado' },
    { label: 'PUBLICACIONES', value: '843', icon: '📄', trend: '+5% mes pasado' },
    { label: 'SOLICITUDES PENDIENTES', value: '28', icon: '📋', trend: '28 sin revisar' },
    { label: 'ENGAGEMENT PROMEDIO', value: '78%', icon: '📈', trend: '+3.2% mes pasado' },
  ];

  const recentActivity = [
    { name: 'Carlos Ruiz', action: 'subió un nuevo manuscrito', time: '2024-1-1024' },
    { name: 'Soporte', action: 'envió un reporte de plagio', time: '2024-1-1024' },
    { name: 'Sahema', action: 'resguardó semanal completada', time: '2024-1-1024' },
    { name: 'María M.', action: 'se registró como autora', time: '2024-1-1024' },
  ];

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
                    Crecimiento de Audiencia
                  </h3>
                  <p className={`text-sm mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tráfico y captación de usuarios en los últimos 6 meses
                  </p>

                  {/* Placeholder for Chart */}
                  <div className={`h-64 rounded-lg flex items-end justify-around gap-2 transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-4`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-yellow-400 rounded w-8 h-16"></div>
                      <span className="text-xs text-gray-500">Ene</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-yellow-400 rounded w-8 h-24"></div>
                      <span className="text-xs text-gray-500">Feb</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-yellow-400 rounded w-8 h-32"></div>
                      <span className="text-xs text-gray-500">Mar</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-yellow-400 rounded w-8 h-40"></div>
                      <span className="text-xs text-gray-500">Abr</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-yellow-400 rounded w-8 h-48"></div>
                      <span className="text-xs text-gray-500">May</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-yellow-400 rounded w-8 h-56"></div>
                      <span className="text-xs text-gray-500">Jun</span>
                    </div>
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
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className={`pb-4 ${index !== recentActivity.length - 1 ? (isDark ? 'border-b border-gray-800' : 'border-b border-gray-200') : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">📝</span>
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
                    ))}
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

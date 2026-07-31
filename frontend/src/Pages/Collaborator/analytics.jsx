import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import { getMyWorks } from '../../services/api';

export default function Analytics() {
  const { isDark } = useContext(ThemeContext);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    try {
      const response = await getMyWorks();
      if (response.ok && response.works) {
        setPublications(response.works);
      }
    } catch (err) {
      console.error('Error cargando publicaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalReads = publications.reduce((sum, work) => sum + (work.views || 0), 0);
    const totalComments = publications.reduce((sum, work) => sum + (work.totalComments || 0), 0);
    const totalLikes = publications.reduce((sum, work) => sum + (work.likesCount || 0), 0);
    const avgEngagement = publications.length > 0
      ? ((totalComments + totalLikes) / publications.length).toFixed(1)
      : 0;

    return {
      totalReads,
      totalComments,
      totalLikes,
      avgEngagement,
    };
  };

  const stats = calculateStats();
  const topWorks = [...publications].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Estadísticas
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Analiza el desempeño de tus publicaciones y el engagement con tu audiencia.
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Lecturas
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stats.totalReads}
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    👁️ Vistas totales
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Comentarios
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stats.totalComments}
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    💬 Interacción
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Me Gusta
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stats.totalLikes}
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    ❤️ Apreciación
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Engagement
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stats.avgEngagement}
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    ✨ Por publicación
                  </p>
                </div>
              </div>

              {/* Circular Chart - Engagement Distribution */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-8 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Distribución de Engagement
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {/* Lecturas */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.totalReads / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 502} 502`}
                          strokeDashoffset="0"
                          transform="rotate(-90 100 100)"
                        />
                        {/* Comentarios */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#60a5fa"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.totalComments / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 502} 502`}
                          strokeDashoffset={`-${(stats.totalReads / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 502}`}
                          transform="rotate(-90 100 100)"
                        />
                        {/* Likes */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#f87171"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.totalLikes / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 502} 502`}
                          strokeDashoffset={`-${((stats.totalReads + stats.totalComments) / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 502}`}
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {stats.totalReads + stats.totalComments + stats.totalLikes}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Total
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col justify-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          Lecturas
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stats.totalReads} ({((stats.totalReads / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-blue-400 rounded"></div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          Comentarios
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stats.totalComments} ({((stats.totalComments / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-red-400 rounded"></div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          Me Gusta
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stats.totalLikes} ({((stats.totalLikes / (stats.totalReads + stats.totalComments + stats.totalLikes)) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Publications */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Tus Publicaciones (Ordenadas por Lecturas)
                </h3>

                {loading ? (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cargando...
                  </p>
                ) : topWorks.length > 0 ? (
                  <div className="space-y-4">
                    {topWorks.map((work, index) => (
                      <div
                        key={work.id}
                        className={`pb-4 ${index !== topWorks.length - 1 ? (isDark ? 'border-b border-gray-800' : 'border-b border-gray-200') : ''}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className={`font-semibold line-clamp-2 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                              {work.title}
                            </h4>
                            <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                              {new Date(work.createdAt).toLocaleDateString('es-CO')} • {work.status === 'approved' ? '✅ Aprobado' : '⏳ Pendiente'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className={`font-bold transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              {work.views || 0}
                            </p>
                            <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                              👁️ Lecturas
                            </p>
                          </div>
                          <div>
                            <p className={`font-bold transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              {work.totalComments || 0}
                            </p>
                            <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                              💬 Comentarios
                            </p>
                          </div>
                          <div>
                            <p className={`font-bold transition-colors ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                              {work.likesCount || 0}
                            </p>
                            <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                              ❤️ Me Gusta
                            </p>
                          </div>
                          <div>
                            <p className={`font-bold transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {work.totalRatings || 0}
                            </p>
                            <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                              ⭐ Votos
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No tienes publicaciones aún
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

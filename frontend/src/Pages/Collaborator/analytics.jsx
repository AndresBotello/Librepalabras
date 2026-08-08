import React, { useContext, useState, useEffect, useMemo } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import { getMyWorks } from '../../services/api';

// --- Subcomponentes para iconos SVG limpios ---
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChatIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const HeartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

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

  // Memorizar estadísticas y prevenir división por cero
  const stats = useMemo(() => {
    const totalReads = publications.reduce((sum, w) => sum + (w.views || 0), 0);
    const totalComments = publications.reduce((sum, w) => sum + (w.totalComments || 0), 0);
    const totalLikes = publications.reduce((sum, w) => sum + (w.likesCount || 0), 0);
    const count = publications.length;
    
    const avgEngagement = count > 0 ? ((totalComments + totalLikes) / count).toFixed(1) : '0';
    const totalInteractions = totalReads + totalComments + totalLikes;

    return {
      totalReads,
      totalComments,
      totalLikes,
      avgEngagement,
      totalInteractions,
    };
  }, [publications]);

  const topWorks = useMemo(() => {
    return [...publications]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [publications]);

  // Cálculos para la gráfica SVG Donut en circunferencia de 440px (r=70)
  const CIRCUMFERENCE = 439.8; 
  const readsRatio = stats.totalInteractions > 0 ? stats.totalReads / stats.totalInteractions : 0;
  const commentsRatio = stats.totalInteractions > 0 ? stats.totalComments / stats.totalInteractions : 0;
  const likesRatio = stats.totalInteractions > 0 ? stats.totalLikes / stats.totalInteractions : 0;

  const readsDash = readsRatio * CIRCUMFERENCE;
  const commentsDash = commentsRatio * CIRCUMFERENCE;
  const likesDash = likesRatio * CIRCUMFERENCE;

  const readsOffset = 0;
  const commentsOffset = -readsDash;
  const likesOffset = -(readsDash + commentsDash);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className={`px-6 sm:px-10 py-8 sm:py-10 border-b transition-colors ${
            isDark ? 'bg-gray-900/60 border-gray-800/80 backdrop-blur-md' : 'bg-white border-gray-200'
          }`}>
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Estadísticas y Analíticas
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Mide el alcance global, interacción y comportamiento de tu audiencia en tiempo real.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 sm:px-10 py-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-32 rounded-xl animate-pulse ${isDark ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  ))
                ) : (
                  <>
                    {/* Card 1: Lecturas */}
                    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 ${
                      isDark ? 'bg-gray-900/80 border-gray-800 shadow-lg shadow-black/20' : 'bg-white border-gray-200/80 shadow-sm hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Lecturas
                        </span>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                          <EyeIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-extrabold tracking-tight">{stats.totalReads.toLocaleString()}</p>
                        <p className="text-xs font-medium text-blue-500 mt-1 flex items-center gap-1">
                          <span>Vistas totales del contenido</span>
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Comentarios */}
                    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 ${
                      isDark ? 'bg-gray-900/80 border-gray-800 shadow-lg shadow-black/20' : 'bg-white border-gray-200/80 shadow-sm hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Comentarios
                        </span>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                          <ChatIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-extrabold tracking-tight">{stats.totalComments.toLocaleString()}</p>
                        <p className="text-xs font-medium text-emerald-500 mt-1">
                          Interacciones en publicaciones
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Me Gusta */}
                    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 ${
                      isDark ? 'bg-gray-900/80 border-gray-800 shadow-lg shadow-black/20' : 'bg-white border-gray-200/80 shadow-sm hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Me Gusta
                        </span>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                          <HeartIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-extrabold tracking-tight">{stats.totalLikes.toLocaleString()}</p>
                        <p className="text-xs font-medium text-rose-500 mt-1">
                          Apreciación de lectores
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Engagement */}
                    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 ${
                      isDark ? 'bg-gray-900/80 border-gray-800 shadow-lg shadow-black/20' : 'bg-white border-gray-200/80 shadow-sm hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Engagement
                        </span>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                          <SparklesIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-3xl font-extrabold tracking-tight">{stats.avgEngagement}</p>
                        <p className="text-xs font-medium text-amber-500 mt-1">
                          Promedio por publicación
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Engagement Chart Section */}
              <div className={`rounded-2xl p-6 sm:p-8 border transition-colors ${
                isDark ? 'bg-gray-900/80 border-gray-800 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-2">
                  <div>
                    <h3 className="text-xl font-bold">Distribución de Engagement</h3>
                    <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Proporción global de la interacción recibida en tus trabajos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Circular Donut Chart */}
                  <div className="flex items-center justify-center relative py-4">
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                      <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                        {/* Background Ring */}
                        <circle
                          cx="100"
                          cy="100"
                          r="70"
                          fill="none"
                          stroke={isDark ? '#1f2937' : '#f3f4f6'}
                          strokeWidth="28"
                        />
                        {stats.totalInteractions > 0 && (
                          <>
                            {/* Lecturas */}
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="28"
                              strokeDasharray={`${readsDash} ${CIRCUMFERENCE}`}
                              strokeDashoffset={readsOffset}
                              className="transition-all duration-700 ease-out"
                            />
                            {/* Comentarios */}
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="28"
                              strokeDasharray={`${commentsDash} ${CIRCUMFERENCE}`}
                              strokeDashoffset={commentsOffset}
                              className="transition-all duration-700 ease-out"
                            />
                            {/* Likes */}
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="28"
                              strokeDasharray={`${likesDash} ${CIRCUMFERENCE}`}
                              strokeDashoffset={likesOffset}
                              className="transition-all duration-700 ease-out"
                            />
                          </>
                        )}
                      </svg>
                      {/* Center Stats */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                        <span className="text-3xl font-black tracking-tight">
                          {stats.totalInteractions.toLocaleString()}
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Total Interacciones
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Legend Cards */}
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      isDark ? 'bg-gray-950/40 border-gray-800' : 'bg-gray-50/80 border-gray-200/70'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                        <div>
                          <p className="font-semibold text-sm">Lecturas</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Vistas acumuladas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{stats.totalReads.toLocaleString()}</p>
                        <p className="text-xs font-semibold text-amber-500">
                          {stats.totalInteractions > 0 ? ((stats.totalReads / stats.totalInteractions) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      isDark ? 'bg-gray-950/40 border-gray-800' : 'bg-gray-50/80 border-gray-200/70'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                        <div>
                          <p className="font-semibold text-sm">Comentarios</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Opiniones recibidas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{stats.totalComments.toLocaleString()}</p>
                        <p className="text-xs font-semibold text-blue-500">
                          {stats.totalInteractions > 0 ? ((stats.totalComments / stats.totalInteractions) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      isDark ? 'bg-gray-950/40 border-gray-800' : 'bg-gray-50/80 border-gray-200/70'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                        <div>
                          <p className="font-semibold text-sm">Me Gusta</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Reacciones positivas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{stats.totalLikes.toLocaleString()}</p>
                        <p className="text-xs font-semibold text-rose-500">
                          {stats.totalInteractions > 0 ? ((stats.totalLikes / stats.totalInteractions) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Publications Section */}
              <div className={`rounded-2xl p-6 sm:p-8 border transition-colors ${
                isDark ? 'bg-gray-900/80 border-gray-800 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Top Publicaciones</h3>
                    <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Tus 5 contenidos más destacados por cantidad de lecturas
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                ) : topWorks.length > 0 ? (
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-800">
                    {topWorks.map((work) => (
                      <div
                        key={work.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              work.status === 'approved'
                                ? isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {work.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(work.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 className={`text-base font-bold truncate transition-colors group-hover:text-blue-500 ${
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {work.title}
                          </h4>
                        </div>

                        {/* Work Quick Stats */}
                        <div className={`grid grid-cols-4 gap-3 sm:gap-6 p-3 rounded-xl ${
                          isDark ? 'bg-gray-950/60 border border-gray-800/60' : 'bg-gray-50 border border-gray-100'
                        }`}>
                          <div className="text-center min-w-[50px]">
                            <p className="text-sm font-extrabold text-blue-500">{(work.views || 0).toLocaleString()}</p>
                            <p className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Lecturas</p>
                          </div>
                          <div className="text-center min-w-[50px]">
                            <p className="text-sm font-extrabold text-emerald-500">{(work.totalComments || 0).toLocaleString()}</p>
                            <p className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Coments</p>
                          </div>
                          <div className="text-center min-w-[50px]">
                            <p className="text-sm font-extrabold text-rose-500">{(work.likesCount || 0).toLocaleString()}</p>
                            <p className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Likes</p>
                          </div>
                          <div className="text-center min-w-[50px]">
                            <p className="text-sm font-extrabold text-amber-500 flex items-center justify-center gap-0.5">
                              <span>{(work.totalRatings || 0).toLocaleString()}</span>
                              <StarIcon className="w-3 h-3 text-amber-400" />
                            </p>
                            <p className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Votos</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <SparklesIcon className="w-8 h-8" />
                    </div>
                    <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Aún no tienes publicaciones
                    </p>
                    <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Crea tu primera publicación para empezar a recopilar estadísticas de lectura e interacción.
                    </p>
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
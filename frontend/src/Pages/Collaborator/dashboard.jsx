import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AreaSidebar from '../../components/AreaSidebar';
import { getMyWorks } from '../../services/api';
import { ROLE_LABELS } from '../../utils/roles';

// Componentes de Iconos SVG para mayor limpieza visual
const Icons = {
  Book: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function CollaboratorDashboard() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');
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
    const totalWorks = publications.length;
    const totalViews = publications.reduce((sum, work) => sum + (work.views || 0), 0);
    const pendingWorks = publications.filter(w => w.status === 'pending_review').length;
    const approvedWorks = publications.filter(w => w.status === 'approved').length;

    return [
      { 
        label: 'Publicaciones', 
        value: totalWorks.toString(), 
        icon: Icons.Book,
        color: 'text-amber-500 bg-amber-500/10'
      },
      { 
        label: 'Visitas Totales', 
        value: totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString(), 
        icon: Icons.Eye,
        color: 'text-blue-500 bg-blue-500/10'
      },
      { 
        label: 'Pendientes', 
        value: pendingWorks.toString(), 
        icon: Icons.Clock, 
        subtitle: 'En revisión editorial',
        color: 'text-yellow-500 bg-yellow-500/10'
      },
      { 
        label: 'Aprobadas', 
        value: approvedWorks.toString(), 
        icon: Icons.Check,
        color: 'text-emerald-500 bg-emerald-500/10'
      },
    ];
  };

  const stats = calculateStats();

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />

      <div className="flex flex-1 w-full max-w-[1600px] mx-auto">
        <AreaSidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header principal */}
          <header className={`px-6 lg:px-10 py-8 border-b transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200/80'}`}>
            <div className="max-w-6xl mx-auto">
              <div>
                {/* El título sigue al rol: esta pantalla la comparten
                    colaborador, juez y administrador, y leer "Panel de
                    Colaborador" siendo admin parecía una degradación. */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Panel de {ROLE_LABELS[user?.role] || 'Autoría'}
                </h1>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Gestiona tus obras literarias, revisa tus métricas e interactúa con el equipo editorial.
                </p>
              </div>

              {/* Tarjetas de Estadísticas (KPIs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className={`p-5 rounded-xl border transition-all duration-200 ${
                        isDark 
                          ? 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700' 
                          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {stat.label}
                        </span>
                        <div className={`p-2 rounded-lg ${stat.color}`}>
                          <Icon />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                        {stat.subtitle && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {stat.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Navegación por Pestañas */}
          <div className={`px-6 lg:px-10 border-b transition-colors ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200/80'}`}>
            <div className="max-w-6xl mx-auto flex gap-6 overflow-x-auto no-scrollbar">
              {[
                { id: 'resumen', label: 'Resumen Global' },
                { id: 'mis-publicaciones', label: 'Mis Publicaciones' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-500 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido de las Pestañas */}
          <section className="flex-1 px-6 lg:px-10 py-8">
            <div className="max-w-6xl mx-auto">
              
              {/* TAB: RESUMEN */}
              {activeTab === 'resumen' && (
                <div>
                  {/* Publicación Destacada/Reciente */}
                  <div className={`p-6 sm:p-8 rounded-xl border transition-colors ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <span>Publicación Reciente</span>
                    </h2>

                    {publications.length > 0 ? (
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="sm:w-44 h-60 flex-shrink-0 rounded-lg overflow-hidden relative bg-slate-800">
                          {publications[0].cover ? (
                            <img
                              src={publications[0].cover}
                              alt={publications[0].title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                              <Icons.Book />
                              <span className="text-xs mt-2">Sin Portada</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                publications[0].status === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-500' 
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {publications[0].status === 'approved' ? 'Publicado' : 'En revisión'}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold mb-1">
                              {publications[0].title}
                            </h3>
                            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Por <span className="font-medium text-slate-300">{publications[0].author}</span>
                            </p>
                            <p className={`text-sm line-clamp-3 leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {publications[0].description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-800/60">
                            <div className="flex items-center gap-6 text-xs">
                              <div>
                                <span className="block font-bold text-base">{publications[0].views || 0}</span>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Lecturas</span>
                              </div>
                              <div>
                                <span className="block font-bold text-base">{publications[0].totalComments || 0}</span>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Comentarios</span>
                              </div>
                              <div>
                                <span className="block font-bold text-base">{publications[0].totalRatings || 0}</span>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Valoraciones</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
                          <Icons.Book />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Aún no has registrado ninguna publicación.
                        </p>
                        <Link
                          to="/collaborator/create"
                          className="mt-4 inline-block text-xs font-semibold text-amber-500 hover:text-amber-400"
                        >
                          + Crear tu primer envío
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB: MIS PUBLICACIONES */}
              {activeTab === 'mis-publicaciones' && (
                <div>
                  {loading ? (
                    <div className="text-center py-16">
                      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cargando obras...</p>
                    </div>
                  ) : publications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {publications.map((work) => (
                        <div key={work.id} className={`group rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                          isDark 
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                            : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                        }`}>
                          <div>
                            <div className="h-44 bg-slate-800 relative overflow-hidden">
                              {work.cover ? (
                                <img
                                  src={work.cover}
                                  alt={work.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <Icons.Book />
                                </div>
                              )}
                              <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold px-2 py-1 rounded-md backdrop-blur-md ${
                                work.status === 'approved' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {work.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                              </span>
                            </div>

                            <div className="p-5">
                              <h4 className="font-bold text-base line-clamp-1 mb-1">
                                {work.title}
                              </h4>
                              <p className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Creado el {new Date(work.createdAt).toLocaleDateString('es-CO')}
                              </p>

                              <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-lg border text-center text-xs mb-4 border-slate-800/40 bg-slate-800/20">
                                <div>
                                  <span className="block font-bold">{work.views || 0}</span>
                                  <span className="text-[10px] text-slate-500">Vistas</span>
                                </div>
                                <div>
                                  <span className="block font-bold">{work.totalComments || 0}</span>
                                  <span className="text-[10px] text-slate-500">Comentarios</span>
                                </div>
                                <div>
                                  <span className="block font-bold">{work.totalRatings || 0}</span>
                                  <span className="text-[10px] text-slate-500">Votos</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-12 text-center rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No tienes publicaciones registradas en este momento.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
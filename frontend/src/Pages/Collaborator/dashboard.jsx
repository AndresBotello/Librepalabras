import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import { getMyWorks } from '../../services/api';

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
      { label: 'TOTAL PUBLICACIONES', value: totalWorks.toString(), icon: '📚' },
      { label: 'VISITAS TOTALES', value: totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString(), icon: '👁️' },
      { label: 'PENDIENTES', value: pendingWorks.toString(), icon: '⏳', subtitle: 'De revisión editorial' },
      { label: 'APROBADAS', value: approvedWorks.toString(), icon: '✅' },
    ];
  };

  const stats = calculateStats();
  const editorialComments = [
    { name: 'Sistema', text: 'Tus publicaciones aparecerán aquí cuando sean revisadas por el equipo editorial.' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header Section */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 max-w-7xl mx-auto">
              <div className="flex-1">
                <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Panel de Colaborador
                </h1>
                <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Bienvenido de nuevo, Camila. Aquí puedes gestionar tus textos literarios, revisar estadísticas y enviar nuevas obras para curación editorial.
                </p>
              </div>
              <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A] whitespace-nowrap">
                📝 Nueva Publicación
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 max-w-7xl mx-auto">
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
                  {stat.subtitle && (
                    <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Section */}
          <div className={`flex-1 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className={`px-6 sm:px-10 py-8 border-b transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="flex gap-8 overflow-x-auto">
                  {['resumen', 'mis-publicaciones', 'nuevo-envio'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 px-2 font-semibold text-sm whitespace-nowrap uppercase tracking-wider transition-colors ${
                        activeTab === tab
                          ? isDark
                            ? 'text-yellow-400 border-b-2 border-yellow-400'
                            : 'text-yellow-600 border-b-2 border-yellow-600'
                          : isDark
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'resumen' && 'Resumen Global'}
                      {tab === 'mis-publicaciones' && 'Mis Publicaciones'}
                      {tab === 'nuevo-envio' && 'Nuevo Envío'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className={`px-6 sm:px-10 py-10 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
              <div className="max-w-7xl mx-auto">
                {activeTab === 'resumen' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Publication */}
                    <div className={`lg:col-span-2 rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                      {publications.length > 0 ? (
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Cover Image */}
                          <div className="md:w-48 flex-shrink-0">
                            {publications[0].cover ? (
                              <img
                                src={publications[0].cover}
                                alt={publications[0].title}
                                className="w-full h-64 md:h-72 object-cover rounded-lg"
                              />
                            ) : (
                              <div className={`w-full h-64 md:h-72 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <span className="text-4xl">📚</span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {publications[0].status === 'approved' ? 'Publicado' : 'Pendiente'}
                            </p>
                            <h3 className={`text-2xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                              {publications[0].title}
                            </h3>
                            <p className={`text-sm mb-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Por <span className="font-semibold">{publications[0].author}</span>
                            </p>
                            <p className={`text-sm mb-6 leading-relaxed transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {publications[0].description}
                            </p>

                            <div className="flex gap-4 mb-6">
                              <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A]">
                                ✏️ Editar
                              </button>
                              <button className={`px-6 py-2 rounded-lg font-semibold transition-colors text-sm ${
                                isDark
                                  ? 'border border-gray-600 text-gray-300 hover:bg-gray-800'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}>
                                👁️ Ver Previa
                              </button>
                            </div>

                            <div className="flex gap-6 text-sm">
                              <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                  {publications[0].views || 0}
                                </p>
                                <p>Lecturas</p>
                              </div>
                              <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                  {publications[0].totalComments || 0}
                                </p>
                                <p>Comentarios</p>
                              </div>
                              <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                  {publications[0].totalRatings || 0}
                                </p>
                                <p>Calificaciones</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className={`text-lg transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            No tienes publicaciones aún. ¡Crea tu primera obra!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Editorial Comments */}
                    <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                      <h3 className={`text-xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        Comentarios Editoriales
                      </h3>
                      <div className="space-y-6">
                        {editorialComments.map((comment, index) => (
                          <div key={index}>
                            <p className={`text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {comment.name}
                            </p>
                            <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                      <a
                        href="#"
                        className={`text-sm font-semibold mt-6 inline-block transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}
                      >
                        Ver todo el comentario →
                      </a>
                    </div>
                  </div>
                )}

                {activeTab === 'mis-publicaciones' && (
                  <div>
                    {loading ? (
                      <div className={`rounded-lg p-8 text-center py-12 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Cargando tus publicaciones...
                        </p>
                      </div>
                    ) : publications.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publications.map((work) => (
                          <div key={work.id} className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} hover:shadow-lg transition-shadow`}>
                            {/* Cover */}
                            <div className={`h-48 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                              {work.cover ? (
                                <img
                                  src={work.cover}
                                  alt={work.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
                              )}
                            </div>
                            {/* Content */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-bold text-sm line-clamp-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                  {work.title}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  work.status === 'approved'
                                    ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                    : work.status === 'pending_review'
                                    ? isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                                    : isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                }`}>
                                  {work.status === 'approved' ? '✓' : work.status === 'pending_review' ? '⏳' : '✕'}
                                </span>
                              </div>
                              <p className={`text-xs mb-3 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(work.createdAt).toLocaleDateString('es-CO')}
                              </p>
                              <div className="flex gap-3 text-xs mb-4">
                                <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <p className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{work.views || 0}</p>
                                  <p>Lecturas</p>
                                </div>
                                <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <p className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{work.totalComments || 0}</p>
                                  <p>Comentarios</p>
                                </div>
                                <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <p className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{work.totalRatings || 0}</p>
                                  <p>Votos</p>
                                </div>
                              </div>
                              <button className="w-full px-3 py-2 rounded text-sm font-semibold bg-[#5D4037] text-white hover:bg-[#4A302A] transition-colors">
                                ✏️ Editar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-lg p-8 text-center py-12 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                        <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No tienes publicaciones aún
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'nuevo-envio' && (
                  <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`text-2xl font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      Nuevo Envío
                    </h3>
                    <p className={`mb-8 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Envía tu nuevo trabajo literario para revisión editorial.
                    </p>
                    <div className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      isDark ? 'border-gray-700 hover:border-yellow-400' : 'border-gray-300 hover:border-yellow-600'
                    }`}>
                      <p className={`text-5xl mb-4 transition-colors`}>📤</p>
                      <p className={`font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        Arrastra tu archivo aquí
                      </p>
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Soporta PDF, DOCX y TXT (máx. 10 MB)
                      </p>
                    </div>
                  </div>
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

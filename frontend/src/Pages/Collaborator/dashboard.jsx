import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';

export default function CollaboratorDashboard() {
  const { isDark } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('resumen');

  const stats = [
    { label: 'TOTAL PUBLICACIONES', value: '24', icon: '📚' },
    { label: 'VISITAS TOTALES', value: '12.4k', icon: '👁️' },
    { label: 'PENDIENTES', value: '3', icon: '⏳', subtitle: 'De revisión editorial' },
    { label: 'DÍAS ACTIVO', value: '342', icon: '📅' },
  ];

  const publications = [
    {
      id: 1,
      title: 'El realismo mágico en Valledupar',
      author: 'Diego Rosado',
      cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop',
      description: 'Exploración de la influencia de Gabo en la narrativa contemporánea del Valle. Un análisis profundo sobre cómo el realismo mágico influye...',
      comments: 5,
      reads: 234
    },
  ];

  const editorialComments = [
    { name: 'Secretaría de la Revista Novela', text: 'Texto poema sugerencia sobre los títu...' },
    { name: 'Coordinador del Río Romanqueri', text: 'Publicado en revistas inscritas o es una...' },
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
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover Image */}
                        <div className="md:w-48 flex-shrink-0">
                          <img
                            src={publications[0].cover}
                            alt={publications[0].title}
                            className="w-full h-64 md:h-72 object-cover rounded-lg"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            Destacado
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
                              ✏️ Continuar Editando
                            </button>
                            <button className={`px-6 py-2 rounded-lg font-semibold transition-colors text-sm ${
                              isDark
                                ? 'border border-gray-600 text-gray-300 hover:bg-gray-800'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}>
                              Ver Previa
                            </button>
                          </div>

                          <div className="flex gap-6 text-sm">
                            <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <p className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {publications[0].reads}
                              </p>
                              <p>Lecturas</p>
                            </div>
                            <div className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <p className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                {publications[0].comments}
                              </p>
                              <p>Comentarios</p>
                            </div>
                          </div>
                        </div>
                      </div>
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
                  <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} text-center py-12`}>
                    <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tus publicaciones aparecerán aquí
                    </p>
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

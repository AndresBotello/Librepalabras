import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';

export default function Analytics() {
  const { isDark } = useContext(ThemeContext);

  const monthlyStats = [
    { month: 'Ene', reads: 120, comments: 8 },
    { month: 'Feb', reads: 240, comments: 12 },
    { month: 'Mar', reads: 380, comments: 18 },
    { month: 'Abr', reads: 290, comments: 10 },
    { month: 'May', reads: 450, comments: 25 },
    { month: 'Jun', reads: 520, comments: 32 },
  ];

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total de Lecturas
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    2,410
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ↑ 15% respecto al mes pasado
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Comentarios
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    105
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ↑ 8% respecto al mes pasado
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tasa de Compromiso
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    8.2%
                  </p>
                  <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ↑ 2.1% respecto al mes pasado
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Tendencia de 6 Meses
                </h3>

                <div className={`h-64 rounded-lg flex items-end justify-around gap-3 transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-4`}>
                  {monthlyStats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1">
                      <div className="flex gap-1 h-48 items-end w-full">
                        <div
                          className="flex-1 bg-yellow-400 rounded-t"
                          style={{ height: `${(stat.reads / 520) * 100}%` }}
                          title={`${stat.reads} lecturas`}
                        ></div>
                        <div
                          className="flex-1 bg-blue-400 rounded-t"
                          style={{ height: `${(stat.comments / 32) * 100}%` }}
                          title={`${stat.comments} comentarios`}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold">{stat.month}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 mt-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Lecturas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Comentarios
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Publications */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Publicaciones Principales
                </h3>

                <div className="space-y-4">
                  {[
                    { title: 'El realismo mágico en Valledupar', reads: 620, comments: 45 },
                    { title: 'Voces del río Grande', reads: 480, comments: 32 },
                    { title: 'Memorias de una ciudad', reads: 290, comments: 18 },
                  ].map((pub, index) => (
                    <div
                      key={index}
                      className={`pb-4 ${index !== 2 ? (isDark ? 'border-b border-gray-800' : 'border-b border-gray-200') : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {pub.title}
                        </h4>
                      </div>
                      <div className="flex gap-8 text-sm">
                        <div>
                          <span className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {pub.reads}
                          </span>
                          <span className={`ml-2 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            lecturas
                          </span>
                        </div>
                        <div>
                          <span className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {pub.comments}
                          </span>
                          <span className={`ml-2 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            comentarios
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

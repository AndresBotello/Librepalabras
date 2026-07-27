import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';

export default function Publications() {
  const { isDark } = useContext(ThemeContext);

  const publications = [
    { id: 1, title: 'El realismo mágico en Valledupar', status: 'Publicado', date: '2024-01-15', reads: 234, comments: 5 },
    { id: 2, title: 'Voces del río Grande', status: 'Bajo revisión', date: '2024-01-10', reads: 45, comments: 2 },
    { id: 3, title: 'Memorias de una ciudad', status: 'Borrador', date: '2024-01-05', reads: 0, comments: 0 },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 max-w-7xl mx-auto">
              <div className="flex-1">
                <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Mis Publicaciones
                </h1>
                <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Administra todas tus publicaciones y envíos literarios.
                </p>
              </div>
              <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A] whitespace-nowrap">
                📝 Nueva Publicación
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <div className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                        <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Título
                        </th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Estado
                        </th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Fecha
                        </th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Lecturas
                        </th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Comentarios
                        </th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {publications.map((pub) => (
                        <tr key={pub.id} className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}>
                          <td className={`px-6 py-4 text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {pub.title}
                          </td>
                          <td className={`px-6 py-4 text-sm`}>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              pub.status === 'Publicado'
                                ? isDark
                                  ? 'bg-green-900 text-green-200'
                                  : 'bg-green-100 text-green-800'
                                : pub.status === 'Bajo revisión'
                                ? isDark
                                  ? 'bg-yellow-900 text-yellow-200'
                                  : 'bg-yellow-100 text-yellow-800'
                                : isDark
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-gray-200 text-gray-700'
                            }`}>
                              {pub.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {pub.date}
                          </td>
                          <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {pub.reads}
                          </td>
                          <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {pub.comments}
                          </td>
                          <td className={`px-6 py-4 text-sm`}>
                            <button className="text-[#5D4037] hover:text-[#4A302A] font-semibold mr-4">
                              Ver
                            </button>
                            <button className={`font-semibold transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

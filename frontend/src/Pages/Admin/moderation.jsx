import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';

export default function Moderation() {
  const { isDark } = useContext(ThemeContext);

  const pendingReviews = [
    { id: 1, title: 'Mi primer cuento', author: 'Juan Pérez', date: '2024-01-10', status: 'Pendiente' },
    { id: 2, title: 'Poesía nocturna', author: 'María García', date: '2024-01-09', status: 'Pendiente' },
    { id: 3, title: 'Ensayo sobre la libertad', author: 'Carlos Ruiz', date: '2024-01-08', status: 'Revisado' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Moderación
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gestiona y revisa los contenidos enviados por los autores de la plataforma.
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">

            {/* Pending Reviews Table */}
            <div className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Título
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Autor
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fecha
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Estado
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReviews.map((review) => (
                      <tr key={review.id} className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}>
                        <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          {review.title}
                        </td>
                        <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {review.author}
                        </td>
                        <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {review.date}
                        </td>
                        <td className={`px-6 py-4 text-sm`}>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            review.status === 'Pendiente'
                              ? isDark
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-yellow-100 text-yellow-800'
                              : isDark
                                ? 'bg-green-900 text-green-200'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {review.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm`}>
                          <button className="text-[#5D4037] hover:text-[#4A302A] font-semibold mr-4">
                            Revisar
                          </button>
                          <button className={`font-semibold transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
                            Rechazar
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

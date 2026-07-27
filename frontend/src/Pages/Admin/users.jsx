import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';

export default function Users() {
  const { isDark } = useContext(ThemeContext);

  const users = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'Autor', joinDate: '2024-01-05', status: 'Activo' },
    { id: 2, name: 'María García', email: 'maria@example.com', role: 'Lector', joinDate: '2024-01-08', status: 'Activo' },
    { id: 3, name: 'Carlos Ruiz', email: 'carlos@example.com', role: 'Moderador', joinDate: '2023-12-15', status: 'Inactivo' },
    { id: 4, name: 'Ana López', email: 'ana@example.com', role: 'Autor', joinDate: '2024-01-10', status: 'Activo' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 max-w-7xl mx-auto">
              <div className="flex-1">
                <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Usuarios
                </h1>
                <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gestiona todos los usuarios registrados en la plataforma.
                </p>
              </div>
              <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A] whitespace-nowrap">
                ➕ Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">

            {/* Users Table */}
            <div className={`rounded-lg overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nombre
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Rol
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fecha de Registro
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
                    {users.map((user) => (
                      <tr key={user.id} className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}>
                        <td className={`px-6 py-4 text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          {user.name}
                        </td>
                        <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.email}
                        </td>
                        <td className={`px-6 py-4 text-sm`}>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'Moderador'
                              ? isDark
                                ? 'bg-purple-900 text-purple-200'
                                : 'bg-purple-100 text-purple-800'
                              : isDark
                                ? 'bg-blue-900 text-blue-200'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.joinDate}
                        </td>
                        <td className={`px-6 py-4 text-sm`}>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'Activo'
                              ? isDark
                                ? 'bg-green-900 text-green-200'
                                : 'bg-green-100 text-green-800'
                              : isDark
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-200 text-gray-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm`}>
                          <button className="text-[#5D4037] hover:text-[#4A302A] font-semibold mr-4">
                            Editar
                          </button>
                          <button className={`font-semibold transition-colors ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                            Eliminar
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

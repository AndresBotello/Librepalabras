import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';

export default function Settings() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    siteTitle: 'Liberapalabras',
    maintenanceMode: false,
    maxUploadSize: '10',
    autoModeration: true,
  });

  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Administrador';
  const initials = `${user?.nombres?.[0] || ''}${user?.apellidos?.[0] || ''}`.toUpperCase() || 'A';
  const createdDate = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  const adminProfile = {
    nombres: user?.nombres || 'Sin nombre',
    apellidos: user?.apellidos || 'Sin apellido',
    email: user?.email || 'Sin email',
    telefono: user?.telefono || 'Sin teléfono',
    genero: user?.genero || 'No especificado',
    fechaNacimiento: user?.fechaNacimiento || 'No especificada',
    edad: user?.edad || 'No especificada',
    role: user?.role || 'admin',
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Configuración
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ajusta los parámetros generales de la plataforma.
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-2xl">

            {/* Admin Profile Card */}
            <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} mb-8`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl ${
                    isDark ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
                  }`}>
                    {initials}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {fullName}
                  </h2>
                  <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    {adminProfile.email}
                  </p>

                  {/* Información Personal */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                        Teléfono:
                      </span>
                      <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {adminProfile.telefono}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                        Género:
                      </span>
                      <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {adminProfile.genero.charAt(0).toUpperCase() + adminProfile.genero.slice(1)}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                        Edad:
                      </span>
                      <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {adminProfile.edad} años
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                        Rol:
                      </span>
                      <p className={`transition-colors font-semibold text-red-600`}>
                        👑 Administrador
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Form */}
            <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <div className="space-y-8">
                {/* Sitio Title */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre del Sitio
                  </label>
                  <input
                    type="text"
                    value={settings.siteTitle}
                    onChange={(e) => handleChange('siteTitle', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
                        : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
                    } focus:outline-none`}
                  />
                </div>

                {/* Max Upload Size */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tamaño Máximo de Carga (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxUploadSize}
                    onChange={(e) => handleChange('maxUploadSize', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
                        : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
                    } focus:outline-none`}
                  />
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Modo de Mantenimiento
                  </label>
                  <button
                    onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      settings.maintenanceMode
                        ? 'bg-[#5D4037]'
                        : isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Auto Moderation */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Moderación Automática
                  </label>
                  <button
                    onClick={() => handleChange('autoModeration', !settings.autoModeration)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      settings.autoModeration
                        ? 'bg-[#5D4037]'
                        : isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        settings.autoModeration ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Divider */}
                <div className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}></div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A]">
                    💾 Guardar Cambios
                  </button>
                  <button className={`px-6 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    isDark
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>
                    ↺ Restaurar
                  </button>
                </div>
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

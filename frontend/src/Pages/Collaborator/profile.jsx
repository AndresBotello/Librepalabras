import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';

export default function Profile() {
  const { isDark } = useContext(ThemeContext);
  const [profile, setProfile] = useState({
    name: 'Camila González',
    email: 'camila@example.com',
    bio: 'Escritora y poeta de Valledupar apasionada por la narrativa contemporánea y el realismo mágico.',
    location: 'Valledupar, Colombia',
    specialties: ['Realismo Mágico', 'Poesía', 'Narrativa Contemporánea'],
  });

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Mi Perfil
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gestiona tu información personal y perfil público.
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-3xl">
              {/* Profile Card */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} mb-8`}>
                <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center font-bold text-4xl ${
                      isDark ? 'bg-[#5D4037] text-white' : 'bg-yellow-100 text-[#5D4037]'
                    }`}>
                      CG
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h2 className={`text-3xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {profile.name}
                    </h2>
                    <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      {profile.email}
                    </p>
                    <p className={`mb-4 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {profile.bio}
                    </p>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-lg">📍</span>
                      <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {profile.location}
                      </span>
                    </div>

                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A]"
                    >
                      {isEditing ? '❌ Cancelar' : '✏️ Editar Perfil'}
                    </button>
                  </div>
                </div>

                {/* Specialties */}
                <div className={isDark ? 'border-t border-gray-800 pt-8' : 'border-t border-gray-200 pt-8'}>
                  <h3 className={`text-lg font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Especialidades
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          isDark
                            ? 'bg-[#5D4037] text-white'
                            : 'bg-yellow-100 text-[#5D4037]'
                        }`}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Publicaciones
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    24
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Seguidores
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    1,240
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Se unió
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    2023
                  </p>
                </div>
              </div>

              {/* Account Settings */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Configuración de Cuenta
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <div>
                      <p className={`font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        Autenticación de Dos Factores
                      </p>
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Aumenta la seguridad de tu cuenta
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg font-semibold text-sm border transition-colors border-gray-400 text-gray-700 hover:bg-gray-100">
                      Activar
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b">
                    <div>
                      <p className={`font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        Cambiar Contraseña
                      </p>
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Actualiza tu contraseña regularmente
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg font-semibold text-sm border transition-colors border-gray-400 text-gray-700 hover:bg-gray-100">
                      Cambiar
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        Descargar Datos
                      </p>
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Obtén una copia de tus datos personales
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg font-semibold text-sm border transition-colors border-gray-400 text-gray-700 hover:bg-gray-100">
                      Descargar
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

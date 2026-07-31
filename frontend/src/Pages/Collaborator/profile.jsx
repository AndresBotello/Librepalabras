import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import { updateUserById, uploadProfilePhoto } from '../../services/api';

export default function Profile() {
  const { isDark } = useContext(ThemeContext);
  const { user, refreshAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.photoURL || null);
  const [formData, setFormData] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    telefono: user?.telefono || '',
    genero: user?.genero || '',
    fechaNacimiento: user?.fechaNacimiento || '',
    descripcion: user?.descripcion || '',
  });

  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Usuario';
  const initials = `${user?.nombres?.[0] || ''}${user?.apellidos?.[0] || ''}`.toUpperCase() || 'U';
  const createdDate = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  const profile = {
    nombres: user?.nombres || 'Sin nombre',
    apellidos: user?.apellidos || 'Sin apellido',
    email: user?.email || 'Sin email',
    telefono: user?.telefono || 'Sin teléfono',
    genero: user?.genero || 'No especificado',
    fechaNacimiento: user?.fechaNacimiento || 'No especificada',
    edad: user?.edad || 'No especificada',
    role: user?.role || 'collaborator',
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const imageUrl = await uploadProfilePhoto(file);
      setProfileImage(imageUrl);
      alert('Foto de perfil subida correctamente');
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al subir la imagen: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      alert('Error: Usuario no identificado');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        photoURL: profileImage,
      };

      await updateUserById(user.uid, updateData);
      await refreshAuth();
      setIsEditing(false);
      alert('Perfil actualizado exitosamente');
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      alert('Error al actualizar el perfil: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

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
                  <div className="flex-shrink-0 relative">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Foto de perfil"
                        className="w-32 h-32 rounded-full object-cover border-4"
                        style={{ borderColor: isDark ? '#5D4037' : '#D2691E' }}
                      />
                    ) : (
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center font-bold text-4xl ${
                        isDark ? 'bg-[#5D4037] text-white' : 'bg-yellow-100 text-[#5D4037]'
                      }`}>
                        {initials}
                      </div>
                    )}
                    {isEditing && (
                      <label className={`absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                        isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}>
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="nombres"
                            placeholder="Nombres"
                            value={formData.nombres}
                            onChange={handleInputChange}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              isDark
                                ? 'bg-gray-800 border-gray-700 text-gray-100'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <input
                            type="text"
                            name="apellidos"
                            placeholder="Apellidos"
                            value={formData.apellidos}
                            onChange={handleInputChange}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              isDark
                                ? 'bg-gray-800 border-gray-700 text-gray-100'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>

                        <input
                          type="tel"
                          name="telefono"
                          placeholder="Teléfono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-gray-100'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />

                        <select
                          name="genero"
                          value={formData.genero}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-gray-100'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Selecciona género</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
                        </select>

                        <input
                          type="date"
                          name="fechaNacimiento"
                          value={formData.fechaNacimiento}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-gray-100'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />

                        <textarea
                          name="descripcion"
                          placeholder="Descripción personal (máx. 500 caracteres)"
                          value={formData.descripcion}
                          onChange={handleInputChange}
                          maxLength="500"
                          rows="4"
                          className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-gray-100'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formData.descripcion.length}/500
                        </p>

                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="flex-1 px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            ✅ Guardar
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            disabled={loading}
                            className="flex-1 px-6 py-2 rounded-lg font-semibold transition-colors text-sm border border-gray-400 hover:bg-gray-100 disabled:opacity-50"
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className={`text-3xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {fullName}
                        </h2>
                        <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                          {profile.email}
                        </p>

                        {/* Información Personal */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                              Teléfono:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.telefono}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                              Género:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.genero.charAt(0).toUpperCase() + profile.genero.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                              Fecha de Nacimiento:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.fechaNacimiento}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                              Edad:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.edad} años
                            </span>
                          </div>
                          {user?.descripcion && (
                            <div className="mt-4 pt-4 border-t" style={{borderColor: isDark ? '#2d2d2d' : '#e0e0e0'}}>
                              <span className="text-sm font-semibold transition-colors" style={{color: isDark ? '#9CA3AF' : '#4B5563'}}>
                                Descripción:
                              </span>
                              <p className={`text-sm transition-colors mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.descripcion}
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A]"
                        >
                          ✏️ Editar Perfil
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rol Badge */}
                <div className={isDark ? 'border-t border-gray-800 pt-8' : 'border-t border-gray-200 pt-8'}>
                  <h3 className={`text-lg font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Estado
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      profile.role === 'admin'
                        ? isDark
                          ? 'bg-red-900 text-red-200'
                          : 'bg-red-100 text-red-800'
                        : isDark
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {profile.role === 'admin' ? '👑 Administrador' : '✍️ Colaborador'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Miembro desde
                  </p>
                  <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {createdDate}
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Rol
                  </p>
                  <p className={`text-lg font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </p>
                </div>

                <div className={`rounded-lg p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`text-sm font-semibold tracking-widest uppercase mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Estado
                  </p>
                  <p className={`text-lg font-bold transition-colors text-green-600`}>
                    ✅ Activo
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

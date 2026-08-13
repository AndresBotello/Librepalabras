import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AreaSidebar from '../../components/AreaSidebar';
import { updateUserById, uploadProfilePhoto } from '../../services/api';
import { getAccountProviders, changePassword, addPasswordToAccount } from '../../services/auth';
import { ROLE_LABELS } from '../../utils/roles';

const EMPTY_PASSWORD_FORM = { current: '', next: '', confirm: '' };
const MIN_PASSWORD_LENGTH = 6;

// Esta pantalla la comparten las cuatro áreas (`/collaborator/profile` y
// `/usuario/perfil`), así que el rol se muestra tal cual venga de la sesión.
// Antes sólo distinguía admin de "Colaborador", y un usuario normal se veía
// etiquetado como colaborador en su propio perfil.
const ROLE_BADGE_ICONS = {
  admin: '👑',
  collaborator: '✍️',
  judge: '⚖️',
  user: '📖',
};

const ROLE_BADGE_COLORS = {
  admin: { dark: 'bg-red-900 text-red-200', light: 'bg-red-100 text-red-800' },
  collaborator: { dark: 'bg-blue-900 text-blue-200', light: 'bg-blue-100 text-blue-800' },
  judge: { dark: 'bg-purple-900 text-purple-200', light: 'bg-purple-100 text-purple-800' },
  user: { dark: 'bg-emerald-900 text-emerald-200', light: 'bg-emerald-100 text-emerald-800' },
};

export default function Profile() {
  const { isDark } = useContext(ThemeContext);
  const { user, refreshAuth } = useAuth();
  const notify = useNotify();
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

  useEffect(() => {
    if (user?.photoURL) setProfileImage(user.photoURL);
  }, [user?.photoURL]);

  useEffect(() => {
    setFormData({
      nombres: user?.nombres || '',
      apellidos: user?.apellidos || '',
      telefono: user?.telefono || '',
      genero: user?.genero || '',
      fechaNacimiento: user?.fechaNacimiento || '',
      descripcion: user?.descripcion || '',
    });
  }, [user?.nombres, user?.apellidos, user?.telefono, user?.genero, user?.fechaNacimiento, user?.descripcion]);

  // Qué métodos de acceso tiene la cuenta: decide si el formulario cambia la
  // contraseña o añade una por primera vez (cuentas que solo entraban con Google).
  const [providers, setProviders] = useState({ ready: false, hasPassword: false, hasGoogle: false });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    getAccountProviders().then((result) => {
      if (!cancelled) setProviders(result);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const isAddingPassword = providers.ready && !providers.hasPassword;

  const closePasswordForm = () => {
    setPasswordOpen(false);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordError('');
  };

  const validatePasswordForm = () => {
    if (!isAddingPassword && !passwordForm.current) {
      return 'Escribe tu contraseña actual';
    }

    if (passwordForm.next.length < MIN_PASSWORD_LENGTH) {
      return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      return 'Las contraseñas no coinciden';
    }

    if (!isAddingPassword && passwordForm.next === passwordForm.current) {
      return 'La nueva contraseña debe ser distinta de la actual';
    }

    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const validationError = validatePasswordForm();

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      if (isAddingPassword) {
        await addPasswordToAccount(passwordForm.next);
        setProviders((prev) => ({ ...prev, hasPassword: true }));
        setPasswordSuccess('Contraseña añadida. Ya puedes entrar con tu correo y contraseña.');
      } else {
        await changePassword(passwordForm.current, passwordForm.next);
        setPasswordSuccess('Contraseña actualizada correctamente.');
      }

      closePasswordForm();
    } catch (error) {
      setPasswordError(error.message || 'No se pudo completar la operación.');
    } finally {
      setPasswordSaving(false);
    }
  };

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
    role: user?.role || 'user',
  };

  const roleLabel = ROLE_LABELS[profile.role] || 'Usuario';
  const roleIcon = ROLE_BADGE_ICONS[profile.role] || ROLE_BADGE_ICONS.user;
  const roleColors = ROLE_BADGE_COLORS[profile.role] || ROLE_BADGE_COLORS.user;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const imageUrl = await uploadProfilePhoto(file);
      setProfileImage(imageUrl);
      notify.success('Foto de perfil subida correctamente.');
    } catch (err) {
      console.error('Error al subir imagen:', err);
      notify.error('No se pudo subir la imagen: ' + (err.message || 'Intenta de nuevo.'));
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
      notify.error('No se pudo identificar tu cuenta. Vuelve a iniciar sesión.');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        photoURL: profileImage,
      };

      await updateUserById(user.uid, updateData);
      setIsEditing(false);
      notify.success('Perfil actualizado correctamente.');
      await refreshAuth();
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      notify.error('No se pudo actualizar el perfil: ' + (err.message || 'Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AreaSidebar />

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
                        style={{ borderColor: isDark ? 'var(--color-brand-700)' : 'var(--color-brand-600)' }}
                      />
                    ) : (
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center font-bold text-4xl ${
                        isDark ? 'bg-brand-700 text-white' : 'bg-yellow-100 text-brand-700'
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
                            className="flex-1 px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? '⏳ Guardando...' : '✅ Guardar'}
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            disabled={loading}
                            className="flex-1 px-6 py-2 rounded-lg font-semibold transition-colors text-sm border border-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-600)'}}>
                              Teléfono:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.telefono}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-600)'}}>
                              Género:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.genero.charAt(0).toUpperCase() + profile.genero.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-600)'}}>
                              Fecha de Nacimiento:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.fechaNacimiento}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold transition-colors" style={{color: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-600)'}}>
                              Edad:
                            </span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {profile.edad} años
                            </span>
                          </div>
                          {user?.descripcion && (
                            <div className="mt-4 pt-4 border-t" style={{borderColor: isDark ? 'var(--color-gray-800)' : 'var(--color-gray-200)'}}>
                              <span className="text-sm font-semibold transition-colors" style={{color: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-600)'}}>
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
                          className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-brand-700 text-white hover:bg-brand-800"
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
                      isDark ? roleColors.dark : roleColors.light
                    }`}>
                      {roleIcon} {roleLabel}
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
                    {roleLabel}
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

                {passwordSuccess && (
                  <div className={`mb-6 rounded-lg px-4 py-3 text-sm border ${
                    isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className={`font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {isAddingPassword ? 'Añadir Contraseña' : 'Cambiar Contraseña'}
                    </p>
                    <p className={`text-sm transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      {isAddingPassword
                        ? 'Tu cuenta entra solo con Google. Añade una contraseña para poder entrar también con tu correo.'
                        : 'Actualiza tu contraseña regularmente'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (passwordOpen ? closePasswordForm() : setPasswordOpen(true))}
                    disabled={!providers.ready}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                        : 'border-gray-400 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {passwordOpen ? 'Cancelar' : isAddingPassword ? 'Añadir' : 'Cambiar'}
                  </button>
                </div>

                {passwordOpen && (
                  <form onSubmit={handlePasswordSubmit} className={`mt-6 pt-6 border-t space-y-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    {passwordError && (
                      <div className={`rounded-lg px-4 py-3 text-sm border ${
                        isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        {passwordError}
                      </div>
                    )}

                    {isAddingPassword && (
                      <p className={`text-sm rounded-lg px-4 py-3 border ${
                        isDark ? 'bg-gray-800/60 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>
                        Es posible que Google te pida confirmar tu identidad en una ventana emergente.
                        Es un paso de seguridad: sin él, cualquiera que encontrara tu sesión abierta
                        podría ponerle una contraseña a tu cuenta.
                      </p>
                    )}

                    {!isAddingPassword && (
                      <div>
                        <label htmlFor="current-password" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Contraseña actual
                        </label>
                        <input
                          id="current-password"
                          type="password"
                          autoComplete="current-password"
                          value={passwordForm.current}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
                          className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-gray-600'
                              : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-300'
                          }`}
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="new-password" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nueva contraseña
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.next}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-gray-600'
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-300'
                        }`}
                      />
                      <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Mínimo {MIN_PASSWORD_LENGTH} caracteres.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confirmar nueva contraseña
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-gray-600'
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-300'
                        }`}
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={closePasswordForm}
                        disabled={passwordSaving}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-colors disabled:opacity-50 ${
                          isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-brand-700 hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {passwordSaving ? 'Guardando...' : isAddingPassword ? 'Añadir contraseña' : 'Actualizar contraseña'}
                      </button>
                    </div>
                  </form>
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

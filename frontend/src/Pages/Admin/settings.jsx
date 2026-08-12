import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { getAdminSettings, updateAdminSettings } from '../../services/api';

export default function Settings() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();

  const [settings, setSettings] = useState(null);
  // Copia de lo último confirmado por el servidor: es contra esto que se
  // comparan los cambios y a esto que vuelve el botón "Restaurar".
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const response = await getAdminSettings();

      if (response.ok) {
        setSettings(response.settings);
        setSaved(response.settings);
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const response = await updateAdminSettings({
        siteTitle: settings.siteTitle,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        maxUploadMb: Number(settings.maxUploadMb),
        autoModeration: settings.autoModeration,
        allowRegistrations: settings.allowRegistrations,
      });

      setSettings(response.settings);
      setSaved(response.settings);
      setFeedback({ type: 'success', text: response.message });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(saved);
    setFeedback(null);
  };

  const isDirty = saved && settings && JSON.stringify(saved) !== JSON.stringify(settings);

  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Administrador';
  const initials = `${user?.nombres?.[0] || ''}${user?.apellidos?.[0] || ''}`.toUpperCase() || 'A';

  const cardClass = `rounded-lg p-8 transition-colors ${
    isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
  }`;

  const inputClass = `w-full px-4 py-2 rounded-lg transition-colors ${
    isDark
      ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
      : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
  } focus:outline-none`;

  const labelClass = `block text-sm font-semibold mb-2 transition-colors ${
    isDark ? 'text-gray-300' : 'text-gray-700'
  }`;

  const helpClass = `text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Configuración
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ajusta los parámetros generales de la plataforma.
            </p>
          </div>

          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-2xl">

              {/* Perfil del administrador */}
              <div className={`${cardClass} mb-8`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className={`w-24 h-24 shrink-0 rounded-full flex items-center justify-center font-bold text-3xl ${
                    isDark ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {fullName}
                    </h2>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user?.email || 'Sin email'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Field label="Teléfono" value={user?.telefono || 'Sin teléfono'} isDark={isDark} />
                      <Field label="Género" value={user?.genero || 'No especificado'} isDark={isDark} />
                      <Field label="Edad" value={user?.edad ? `${user.edad} años` : 'No especificada'} isDark={isDark} />
                      <div>
                        <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rol:</span>
                        <p className="font-semibold text-red-600">👑 Administrador</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {feedback && (
                <div
                  role="status"
                  className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
                    feedback.type === 'success'
                      ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                      : isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              {loading ? (
                <div className={cardClass}>
                  <div className="space-y-6">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className={`h-12 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                </div>
              ) : !settings ? (
                <div className={cardClass}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    No se pudo cargar la configuración.
                  </p>
                  <button
                    onClick={load}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-700 text-white hover:bg-brand-800"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className={cardClass}>
                  <div className="space-y-8">
                    <div>
                      <label htmlFor="siteTitle" className={labelClass}>Nombre del Sitio</label>
                      <input
                        id="siteTitle"
                        type="text"
                        value={settings.siteTitle}
                        onChange={(e) => handleChange('siteTitle', e.target.value)}
                        className={inputClass}
                      />
                      <p className={helpClass}>Aparece en la pantalla de mantenimiento y en los correos de invitación.</p>
                    </div>

                    <div>
                      <label htmlFor="maxUploadMb" className={labelClass}>Tamaño Máximo de Carga (MB)</label>
                      <input
                        id="maxUploadMb"
                        type="number"
                        min="1"
                        max="50"
                        value={settings.maxUploadMb}
                        onChange={(e) => handleChange('maxUploadMb', e.target.value)}
                        className={inputClass}
                      />
                      <p className={helpClass}>Entre 1 y 50 MB. Es el límite que se muestra a quien sube archivos.</p>
                    </div>

                    <Toggle
                      label="Registro de nuevas cuentas"
                      description="Si lo desactivas, solo se podrá entrar por invitación."
                      checked={settings.allowRegistrations}
                      onChange={(value) => handleChange('allowRegistrations', value)}
                      isDark={isDark}
                    />

                    <Toggle
                      label="Moderación previa de obras"
                      description="Las obras nuevas quedan pendientes de revisión antes de publicarse."
                      checked={settings.autoModeration}
                      onChange={(value) => handleChange('autoModeration', value)}
                      isDark={isDark}
                    />

                    <div className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'} />

                    <Toggle
                      label="Modo de Mantenimiento"
                      description="Cierra el sitio al público. Los administradores siguen entrando con normalidad."
                      checked={settings.maintenanceMode}
                      onChange={(value) => handleChange('maintenanceMode', value)}
                      isDark={isDark}
                      danger
                    />

                    {settings.maintenanceMode && (
                      <div>
                        <label htmlFor="maintenanceMessage" className={labelClass}>
                          Mensaje que verán los visitantes
                        </label>
                        <textarea
                          id="maintenanceMessage"
                          rows={3}
                          maxLength={300}
                          value={settings.maintenanceMessage}
                          onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                          className={`${inputClass} resize-none`}
                        />
                        <p className={helpClass}>{settings.maintenanceMessage?.length || 0}/300 caracteres.</p>
                      </div>
                    )}

                    <div className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'} />

                    <div className="flex flex-wrap gap-4 items-center">
                      <button
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className="px-6 py-2 rounded-lg font-semibold text-sm bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? 'Guardando…' : '💾 Guardar Cambios'}
                      </button>

                      <button
                        onClick={handleReset}
                        disabled={saving || !isDirty}
                        className={`px-6 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        ↺ Descartar cambios
                      </button>

                      {isDirty && (
                        <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                          Hay cambios sin guardar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Field({ label, value, isDark }) {
  return (
    <div>
      <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}:</span>
      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{value}</p>
    </div>
  );
}

function Toggle({ label, description, checked, onChange, isDark, danger = false }) {
  const activeColor = danger ? 'bg-amber-600' : 'bg-brand-700';

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
        {description && (
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${
          checked ? activeColor : isDark ? 'bg-gray-700' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

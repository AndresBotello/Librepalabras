import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import gendersData from '../config/genders.json';

export default function EditUserModal({ isOpen, user, isDark, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    genero: '',
    role: '',
  });
  const [error, setError] = useState('');
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        telefono: (user.telefono || '').replace(/^\+57/, ''),
        genero: user.genero || '',
        role: user.role || '',
      });
      setError('');
    }
  }, [user, isOpen]);

  // El modal se abre antes de que llegue el perfil, así que el foco se coloca
  // cuando el formulario ya existe, no al abrir.
  useEffect(() => {
    if (isOpen && user) {
      firstFieldRef.current?.focus();
    }
  }, [isOpen, user]);

  // Sin esto la página de fondo sigue haciendo scroll bajo el modal.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.nombres || formData.nombres.length < 2) {
      setError('Nombres debe tener al menos 2 caracteres');
      return false;
    }

    if (!formData.apellidos || formData.apellidos.length < 2) {
      setError('Apellidos debe tener al menos 2 caracteres');
      return false;
    }

    if (!formData.telefono || !/^\d{7,15}$/.test(formData.telefono)) {
      setError('Teléfono debe tener entre 7 y 15 dígitos');
      return false;
    }

    if (!formData.genero) {
      setError('Género es obligatorio');
      return false;
    }

    if (!formData.role) {
      setError('Rol es obligatorio');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    const updateData = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      telefono: formData.telefono,
      genero: formData.genero,
      role: formData.role,
    };

    onSave(updateData);
  };

  if (!isOpen) return null;

  const labelClass = `block text-xs font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const fieldClass = `w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:ring-slate-600'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-300'
  }`;

  // El perfil se pide al abrir: mientras llega se muestra la misma estructura en
  // gris en vez de un modal vacío que parece roto.
  const isLoadingProfile = !user;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-modal-overlay"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-md max-h-[85vh] rounded-xl border shadow-2xl flex flex-col animate-modal-panel transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-4 px-6 py-4 border-b flex-shrink-0 transition-colors ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="min-w-0">
            <h2
              id="edit-user-title"
              className={`text-lg font-semibold tracking-tight transition-colors ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
            >
              Editar usuario
            </h2>
            <p className={`text-xs mt-0.5 truncate transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isLoadingProfile ? 'Cargando perfil...' : user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar"
            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoadingProfile ? (
          /* Esqueleto de carga */
          <div className="p-6 space-y-4 flex-1">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="space-y-1.5">
                <div className={`h-3 w-20 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                <div className={`h-9 w-full rounded-lg animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              </div>
            ))}
          </div>
        ) : (
          /* Body - Scrollable */
          <form id="edit-user-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${
                isDark ? 'border-rose-900/60 bg-rose-950/40 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                {error}
              </div>
            )}

            {/* Nombres */}
            <div>
              <label htmlFor="edit-user-nombres" className={labelClass}>Nombres</label>
              <input
                id="edit-user-nombres"
                ref={firstFieldRef}
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                className={fieldClass}
              />
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="edit-user-apellidos" className={labelClass}>Apellidos</label>
              <input
                id="edit-user-apellidos"
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                className={fieldClass}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="edit-user-telefono" className={labelClass}>Teléfono</label>
              <div className="relative flex items-center">
                <span className={`absolute left-3 text-sm font-medium pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  +57
                </span>
                <input
                  id="edit-user-telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  maxLength="15"
                  className={`${fieldClass} pl-11`}
                />
              </div>
            </div>

            {/* Género */}
            <div>
              <label htmlFor="edit-user-genero" className={labelClass}>Género</label>
              <select
                id="edit-user-genero"
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="">Selecciona género</option>
                {gendersData.map((gender) => (
                  <option key={gender.value} value={gender.value}>
                    {gender.icon} {gender.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="edit-user-role" className={labelClass}>Rol</label>
              <select
                id="edit-user-role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="">Selecciona rol</option>
                <option value="user">Usuario</option>
                <option value="collaborator">Colaborador</option>
                <option value="judge">Juez</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </form>
        )}

        {/* Footer - Botones */}
        <div className={`flex gap-3 px-6 py-4 border-t flex-shrink-0 rounded-b-xl transition-colors ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-white'
            }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={isLoading || isLoadingProfile}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

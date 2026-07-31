import React, { useState, useEffect } from 'react';
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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative z-50 w-full max-w-md max-h-[90vh] rounded-lg shadow-lg flex flex-col transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 transition-colors ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Editar Usuario
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <form id="edit-user-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className={`rounded px-4 py-2 text-sm border ${isDark ? 'border-red-700 bg-red-900 text-red-200' : 'border-red-300 bg-red-100 text-red-800'}`}>
              {error}
            </div>
          )}

          {/* Nombres */}
          <div>
            <label className={`block text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nombres
            </label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
            />
          </div>

          {/* Apellidos */}
          <div>
            <label className={`block text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Apellidos
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className={`block text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Teléfono
            </label>
            <div className="relative flex items-center">
              <span className={`absolute left-3 text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                +57
              </span>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                maxLength="15"
                className={`w-full pl-10 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
              />
            </div>
          </div>

          {/* Género */}
          <div>
            <label className={`block text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Género
            </label>
            <select
              name="genero"
              value={formData.genero}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
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
            <label className={`block text-xs font-semibold mb-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Rol
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
            >
              <option value="">Selecciona rol</option>
              <option value="collaborator">Colaborador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

        </form>

        {/* Footer - Botones */}
        <div className={`flex gap-3 px-6 py-4 border-t flex-shrink-0 transition-colors ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded text-sm font-semibold transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-user-form"
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded text-sm font-semibold text-white bg-[#5D4037] hover:bg-[#4A302A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

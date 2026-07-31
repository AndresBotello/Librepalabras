import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '../../services/auth';
import { useAuth } from '../../context/AuthContext.jsx';
import gendersData from '../../config/genders.json';

export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
  });

  const edad = useMemo(() => {
    if (!formData.fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(formData.fechaNacimiento);
    let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edadCalculada--;
    }
    return edadCalculada;
  }, [formData.fechaNacimiento]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setStatusMessage('Por favor completa todos los campos');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatusMessage('Por favor ingresa un correo válido');
      return false;
    }

    if (formData.password.length < 6) {
      setStatusMessage('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!isLogin) {
      if (!formData.nombres || !formData.apellidos) {
        setStatusMessage('Nombres y Apellidos son obligatorios');
        return false;
      }

      if (formData.nombres.length < 2 || formData.apellidos.length < 2) {
        setStatusMessage('Nombres y Apellidos deben tener al menos 2 caracteres');
        return false;
      }

      if (!formData.telefono || !/^\d{7,15}$/.test(formData.telefono)) {
        setStatusMessage('Ingresa un teléfono válido (7-15 dígitos)');
        return false;
      }

      if (!formData.fechaNacimiento) {
        setStatusMessage('La fecha de nacimiento es obligatoria');
        return false;
      }

      if (edad === null || edad < 13) {
        setStatusMessage('Debes tener al menos 13 años para registrarte');
        return false;
      }

      if (!formData.genero) {
        setStatusMessage('Por favor selecciona un género');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password, rememberMe);
      } else {
        const profileData = {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefono: formData.telefono,
          fechaNacimiento: formData.fechaNacimiento,
          edad: edad,
          genero: formData.genero,
        };

        await registerWithEmail(formData.email, formData.password, profileData, rememberMe);
      }

      const sessionUser = await refreshAuth();
      const role = sessionUser?.role || 'collaborator';

      navigate(role === 'admin' ? '/admin/dashboard' : '/collaborator/dashboard');
    } catch (error) {
      setStatusMessage(error.message || 'No se pudo conectar con el backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const user = await loginWithGoogle(rememberMe);
      const sessionUser = await refreshAuth();
      const role = sessionUser?.role || user?.role || 'collaborator';
      setStatusMessage('Google conectado correctamente.');
      console.log('Authenticated user:', user);
      navigate(role === 'admin' ? '/admin/dashboard' : '/collaborator/dashboard');
    } catch (error) {
      setStatusMessage(error.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { isDark } = useContext(ThemeContext);

  const goToMode = (mode) => {
    navigate(mode === 'login' ? '/login' : '/register');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-100'}`}>
      <Navbar />
      <div className="flex flex-1 flex-col lg:flex-row lg:gap-0">
      {/* Left Section - Form */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-8 sm:py-12 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Logo */}

        {/* Main Card */}
        <div className={`w-full max-w-sm rounded-xl shadow-lg border p-8 transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className={`text-2xl sm:text-3xl font-bold mb-3 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
              {isLogin ? 'Bienvenido de vuelta' : 'Bienvenido a la comunidad'}
            </h1>
            <p className={`text-sm leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-[#5D4037]'}`}>
              {isLogin
                ? 'Inicia sesión para continuar tu viaje literario'
                : 'Únete a la conversación literaria más vibrante de Valledupar'
              }
            </p>
          </div>

          {/* Tabs */}
          <div className={`flex gap-4 mb-8 border-b transition-colors ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            <button
              type="button"
              onClick={() => goToMode('login')}
              className={`pb-3 font-semibold text-sm flex-1 transition-colors ${
                isLogin
                  ? isDark ? 'text-gray-100 border-b-2 border-gray-100 -mb-px' : 'text-[#5D4037] border-b-2 border-gray-900 -mb-px'
                  : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-[#5D4037]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => goToMode('register')}
              className={`pb-3 font-semibold text-sm flex-1 transition-colors ${
                !isLogin
                  ? isDark ? 'text-gray-100 border-b-2 border-gray-100 -mb-px' : 'text-[#5D4037] border-b-2 border-gray-900 -mb-px'
                  : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-[#5D4037]'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {statusMessage ? (
              <div className={`rounded-lg px-4 py-3 text-sm border ${isDark ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-[#5D4037]'}`}>
                {statusMessage}
              </div>
            ) : null}

            {/* Campos de Registro */}
            {!isLogin && (
              <>
                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      placeholder="Juan Carlos"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] placeholder-gray-400 focus:ring-gray-900 focus:border-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      placeholder="García López"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] placeholder-gray-400 focus:ring-gray-900 focus:border-gray-900'}`}
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                    Teléfono
                  </label>
                  <div className="relative flex items-center">
                    <span className={`absolute left-3 font-semibold text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      +57
                    </span>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="3001234567"
                      maxLength="15"
                      className={`w-full pl-14 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] placeholder-gray-400 focus:ring-gray-900 focus:border-gray-900'}`}
                    />
                  </div>
                </div>

                {/* Fecha de Nacimiento y Edad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] focus:ring-gray-900 focus:border-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                      Edad
                    </label>
                    <div className={`w-full px-4 py-2.5 border rounded-lg flex items-center transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-[#5D4037]'}`}>
                      {edad !== null ? <span className="font-semibold">{edad} años</span> : <span className="text-gray-500">Selecciona fecha</span>}
                    </div>
                  </div>
                </div>

                {/* Género */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                    Género
                  </label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] focus:ring-gray-900 focus:border-gray-900'}`}
                  >
                    <option value="">Selecciona un género</option>
                    {gendersData.map((gender) => (
                      <option key={gender.value} value={gender.value}>
                        {gender.icon} {gender.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-4 h-4 transition-colors ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@libro.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] placeholder-gray-400 focus:ring-gray-900 focus:border-gray-900'}`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-xs font-semibold mb-2 tracking-wider uppercase transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                Contraseña
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-4 h-4 transition-colors ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-gray-500 focus:border-gray-500' : 'bg-gray-50 border-gray-300 text-[#5D4037] placeholder-gray-400 focus:ring-gray-900 focus:border-gray-900'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 transition-colors ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`w-4 h-4 rounded transition-colors ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}
                  style={{accentColor: '#5D4037'}}
                />
                <span className={`text-sm transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>Mantener sesión iniciada</span>
              </label>
              <a href="#" className={`text-xs transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-[#5D4037]'}`}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 text-sm tracking-wide uppercase"
              style={{backgroundColor: '#5D4037'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}
            >
              {isSubmitting ? 'Conectando...' : isLogin ? 'Iniciar Sesión' : 'Crear mi Cuenta'}
              <span>→</span>
            </button>

            {/* Divider */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t transition-colors ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className={`px-3 tracking-wider uppercase font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                  O CONTINUAR CON
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-[#5D4037]'}`}
              >
                <span className="text-lg">🔴</span>
                <span className="font-medium">Google</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-[#5D4037]'}`}
              >
                <span className="text-lg">⚫</span>
                <span className="font-medium">GitHub</span>
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-xs">
            <span className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin ? '¿No eres miembro? ' : '¿Ya tienes cuenta? '}
              <button
                type="button"
                onClick={() => goToMode(isLogin ? 'register' : 'login')}
                className={`font-semibold transition-colors underline-offset-2 hover:underline ${isDark ? 'text-gray-200 hover:text-gray-100' : 'text-[#5D4037] hover:text-[#5D4037]'}`}
              >
                {isLogin ? 'Solicita acceso aquí' : 'Inicia sesión'}
              </button>
            </span>
          </div>
        </div>


      </div>

      {/* Right Section - Decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 relative"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045439/ebd25bff-35fb-4c83-a45f-04770cfbe21a_hvxmhk.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f5f0eb'
        }}
      >
        {/* Overlay light para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/30"></div>

        <div className="text-center max-w-xs relative z-10 mt-auto mb-8">
          {/* Quote Box */}
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white">
            <p className="text-[#5D4037] text-sm font-serif italic mb-4 leading-relaxed">
              "La literatura es el arte de la palabra, y aquí en el Valle, cada palabra cuenta una historia que merece ser liberada."
            </p>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-9 h-9 bg-gray-800 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AD</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#5D4037] text-xs">Andrés Felipe Dana</p>
                <p className="text-gray-600 text-xs">Fundador y Community Manager</p>
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

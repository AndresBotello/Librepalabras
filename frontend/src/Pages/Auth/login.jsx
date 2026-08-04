import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Calendar, ArrowRight } from 'lucide-react';
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
      setStatusMessage('Por favor completa todos los campos principales');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatusMessage('Por favor ingresa un correo electrónico válido');
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
      setStatusMessage(error.message || 'No se pudo conectar con el servidor.');
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
      navigate(role === 'admin' ? '/admin/dashboard' : '/collaborator/dashboard');
    } catch (error) {
      setStatusMessage(error.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { isDark } = useContext(ThemeContext);

  const goToMode = (mode) => {
    setIsLogin(mode === 'login');
    setStatusMessage('');
    navigate(mode === 'login' ? '/login' : '/register');
  };

  // Clases dinámicas reutilizables
  const inputBaseClasses = `w-full py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${
    isDark
      ? 'bg-gray-800/90 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-[#5D4037]/20 focus:border-[#5D4037]'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 tracking-wider uppercase transition-colors ${
    isDark ? 'text-gray-300' : 'text-[#5D4037]'
  }`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar />
      
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Section - Form Container */}
        <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          
          {/* Form Card */}
          <div className={`w-full transition-all duration-300 ${isLogin ? 'max-w-md' : 'max-w-lg'} rounded-2xl shadow-xl border p-6 sm:p-8 ${
            isDark ? 'bg-gray-900/90 border-gray-800 shadow-black/40' : 'bg-white border-gray-200/80 shadow-gray-200/50'
          }`}>
            
            {/* Header */}
            <div className="mb-6 text-center sm:text-left">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
                {isLogin ? '¡Hola de nuevo!' : 'Únete a la comunidad'}
              </h1>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isLogin
                  ? 'Inicia sesión para acceder a tu espacio literario.'
                  : 'Forma parte del punto de encuentro cultural en Valledupar.'
                }
              </p>
            </div>

            {/* Selector de Pestañas */}
            <div className={`flex rounded-xl p-1 mb-6 transition-colors ${isDark ? 'bg-gray-800/70' : 'bg-gray-100'}`}>
              <button
                type="button"
                onClick={() => goToMode('login')}
                className={`flex-1 py-2 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  isLogin
                    ? isDark
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'bg-white text-[#5D4037] shadow-sm font-semibold'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => goToMode('register')}
                className={`flex-1 py-2 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  !isLogin
                    ? isDark
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'bg-white text-[#5D4037] shadow-sm font-semibold'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className={`mb-5 rounded-xl px-4 py-3 text-sm border flex items-center gap-2 animate-fadeIn ${
                statusMessage.includes('correctamente')
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campos dinámicos de Registro */}
              {!isLogin && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Nombres y Apellidos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Nombres</label>
                      <div className="relative">
                        <User className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          name="nombres"
                          value={formData.nombres}
                          onChange={handleInputChange}
                          placeholder="Gabriel"
                          className={`${inputBaseClasses} pl-10 pr-3`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Apellidos</label>
                      <div className="relative">
                        <User className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos}
                          onChange={handleInputChange}
                          placeholder="García Márquez"
                          className={`${inputBaseClasses} pl-10 pr-3`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className={labelClasses}>Teléfono Móvil</label>
                    <div className="relative flex items-center">
                      <Phone className={`absolute left-3.5 top-3 w-4 h-4 z-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`absolute left-9 font-semibold text-xs border-r pr-2 transition-colors ${
                        isDark ? 'text-amber-400 border-gray-700' : 'text-[#5D4037] border-gray-200'
                      }`}>
                        +57
                      </span>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="300 123 4567"
                        maxLength="15"
                        className={`${inputBaseClasses} pl-20 pr-4`}
                      />
                    </div>
                  </div>

                  {/* Fecha de Nacimiento y Edad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Fecha Nacimiento</label>
                      <div className="relative">
                        <Calendar className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          type="date"
                          name="fechaNacimiento"
                          value={formData.fechaNacimiento}
                          onChange={handleInputChange}
                          className={`${inputBaseClasses} pl-10 pr-3`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Edad</label>
                      <div className={`w-full py-2.5 px-4 border rounded-xl flex items-center text-sm font-medium ${
                        isDark ? 'bg-gray-800/40 border-gray-700 text-gray-300' : 'bg-gray-100/70 border-gray-200 text-gray-700'
                      }`}>
                        {edad !== null ? (
                          <span className="text-emerald-500 font-semibold">{edad} años</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Calculada aut.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Género */}
                  <div>
                    <label className={labelClasses}>Género</label>
                    <select
                      name="genero"
                      value={formData.genero}
                      onChange={handleInputChange}
                      className={`${inputBaseClasses} px-3`}
                    >
                      <option value="">Selecciona tu género</option>
                      {gendersData.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.icon} {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className={labelClasses}>Correo Electrónico</label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="usuario@ejemplo.com"
                    className={`${inputBaseClasses} pl-10 pr-4`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className={labelClasses}>Contraseña</label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={`${inputBaseClasses} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-3 transition-colors ${
                      isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#5D4037] focus:ring-[#5D4037]"
                  />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Mantener sesión</span>
                </label>
                <a href="#" className={`font-medium transition-colors ${
                  isDark ? 'text-amber-400 hover:text-amber-300' : 'text-[#5D4037] hover:underline'
                }`}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 mt-6 text-sm tracking-wider uppercase bg-[#5D4037] hover:bg-[#4A302A] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear mi Cuenta'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-3 uppercase font-medium tracking-wider ${
                    isDark ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'
                  }`}>
                    o acceder con
                  </span>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2.5 px-4 py-2.5 border rounded-xl transition-all text-sm font-medium ${
                    isDark
                      ? 'border-gray-800 bg-gray-800/50 hover:bg-gray-800 text-gray-200'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2.5 px-4 py-2.5 border rounded-xl transition-all text-sm font-medium ${
                    isDark
                      ? 'border-gray-800 bg-gray-800/50 hover:bg-gray-800 text-gray-200'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>
            </form>

            {/* Bottom Link */}
            <div className="mt-8 text-center text-xs">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {isLogin ? '¿Aún no tienes cuenta? ' : '¿Ya tienes una cuenta? '}
                <button
                  type="button"
                  onClick={() => goToMode(isLogin ? 'register' : 'login')}
                  className={`font-semibold transition-colors hover:underline ${
                    isDark ? 'text-amber-400' : 'text-[#5D4037]'
                  }`}
                >
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Visual / Quote Banner */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-end p-12 relative overflow-hidden"
          style={{
            backgroundImage: 'url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045439/ebd25bff-35fb-4c83-a45f-04770cfbe21a_hvxmhk.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Layer Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>

          {/* Quote Glassmorphic Box */}
          <div className="max-w-md relative z-10 w-full">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl text-white">
              <p className="text-base font-serif italic mb-6 leading-relaxed text-amber-100">
                "La literatura es el arte de la palabra, y aquí en el Valle, cada palabra cuenta una historia que merece ser liberada."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#5D4037] to-amber-700 rounded-full flex-shrink-0 flex items-center justify-center border border-amber-300/40 shadow-inner">
                  <span className="text-white text-xs font-bold tracking-wider">AD</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Andrés Felipe Dana</p>
                  <p className="text-gray-300 text-xs">Fundador y Community Manager</p>
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
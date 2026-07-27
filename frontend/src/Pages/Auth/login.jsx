import React, { useState, useContext } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const { isDark } = useContext(ThemeContext);

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
              onClick={() => setIsLogin(true)}
              className={`pb-3 font-semibold text-sm flex-1 transition-colors ${
                isLogin
                  ? isDark ? 'text-gray-100 border-b-2 border-gray-100 -mb-px' : 'text-[#5D4037] border-b-2 border-gray-900 -mb-px'
                  : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-[#5D4037]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
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
              className="w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 text-sm tracking-wide uppercase"
              style={{backgroundColor: '#5D4037'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}
            >
              {isLogin ? 'Iniciar Sesión' : 'Crear mi Cuenta'}
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
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-[#5D4037]'}`}
              >
                <span className="text-lg">🔍</span>
                <span className="font-medium">Google</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-[#5D4037]'}`}
              >
                <span className="text-lg">🐙</span>
                <span className="font-medium">GitHub</span>
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-xs">
            <span className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin ? '¿No eres miembro? ' : '¿Ya tienes cuenta? '}
              <a href="#" className={`font-semibold transition-colors ${isDark ? 'text-gray-200 hover:text-gray-100' : 'text-[#5D4037] hover:text-[#5D4037]'}`}>
                {isLogin ? 'Solicita acceso aquí' : 'Inicia sesión'}
              </a>
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

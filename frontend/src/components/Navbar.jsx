import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 w-full py-3 sm:py-4 px-4 sm:px-8 transition-colors z-50 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'} border-b`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded flex items-center justify-center" style={{backgroundColor: '#5D4037'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 6C2 4.89543 2.89543 4 4 4H12V18C12 19.1046 11.1046 20 10 20H4C2.89543 20 2 19.1046 2 18V6Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M22 6C22 4.89543 21.1046 4 20 4H12V18C12 19.1046 12.8954 20 14 20H20C21.1046 20 22 19.1046 22 18V6Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className={`font-semibold text-xs sm:text-sm tracking-wide transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>Liberapalabras</span>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link to="/" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037]'}`}>
              Inicio
            </Link>
            <Link to="/literature" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037]'}`}>
              Literatura
            </Link>
            <Link to="/stories" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037]'}`}>
              Historias
            </Link>
            <Link to="/authors" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037]'}`}>
              Autores
            </Link>
            <Link to="#" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037]'}`}>
              Sobre
            </Link>
          </div>

          {/* Auth Buttons & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={toggleTheme}
              className={`text-xs sm:text-sm font-medium transition-colors px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${isDark ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <span className={`text-xs sm:text-sm font-medium transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                    {user?.name || user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs sm:text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
                    style={{backgroundColor: '#5D4037'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-xs sm:text-sm font-medium transition-colors hidden sm:inline ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-[#4A302A]'}`}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-medium text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors hidden sm:inline"
                  style={{backgroundColor: '#5D4037'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}
                >
                  Crear Cuenta
                </Link>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-gray-900'}`}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`md:hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b transition-colors`}>
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-gray-900'}`}>
              Inicio
            </Link>
            <Link to="/literature" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-gray-900'}`}>
              Literatura
            </Link>
            <Link to="/stories" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-gray-900'}`}>
              Historias
            </Link>
            <Link to="/authors" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-gray-900'}`}>
              Autores
            </Link>
            <div className="pt-4 space-y-3 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
              {isAuthenticated ? (
                <>
                  <p className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-300' : 'text-[#5D4037]'}`}>
                    {user?.name || user?.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
                    style={{backgroundColor: '#5D4037'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-[#5D4037] hover:text-gray-900'}`}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors text-center"
                    style={{backgroundColor: '#5D4037'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}
                  >
                    Crear Cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

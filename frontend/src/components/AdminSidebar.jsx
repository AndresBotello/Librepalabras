import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const IconModeration = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L15.09 8.26H22L17.55 12.7L18.91 18.26L12 14.01L5.09 18.26L6.45 12.7L2 8.26H8.91L12 2Z" />
  </svg>
);

const IconUsers = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconFiles = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const IconSettings = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
  </svg>
);

const IconReports = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconNotifications = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconMagazine = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconContest = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const IconBooks = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function AdminSidebar() {
  const { isDark } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { icon: IconModeration, label: 'Moderación', path: '/admin/moderation' },
    { icon: IconUsers, label: 'Usuarios', path: '/admin/users' },
    { icon: IconFiles, label: 'Archivos', path: '/admin/files' },
    { icon: IconBooks, label: 'Venta de Libros', path: '/admin/publishbook' },
    { icon: IconMagazine, label: 'Revista Poleversia', path: '/admin/poleversia' },
    { icon: IconContest, label: 'Convocatorias', path: '/admin/concursos' },
    { icon: IconContest, label: 'Calificar Concursos', path: '/concursos/panel' },
    { icon: IconSettings, label: 'Configuración', path: '/admin/settings' },
  ];

  const additionalItems = [
    { icon: IconReports, label: 'Reportes', path: '#' },
    { icon: IconNotifications, label: 'Notificaciones', path: '#' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 md:hidden bg-[#5D4037] text-white p-3 rounded-full shadow-lg hover:bg-[#4A302A] transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 right-0 h-screen md:h-full md:w-72 w-72 transition-transform duration-300 z-30 md:z-0 flex flex-col ${
          !isOpen ? 'translate-x-full md:translate-x-0' : 'translate-x-0'
        } ${isDark ? 'bg-gray-900 border-l border-gray-800' : 'bg-white border-l border-gray-200'}`}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 left-4 md:hidden text-2xl"
        >
          ✕
        </button>

        {/* Sidebar Content */}
        <div className="pt-16 md:pt-8 px-6 py-8 flex-1 overflow-y-auto">
          {/* Dashboard Quick Link */}
          <Link
            to="/admin/dashboard"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-6 ${
              isActive('/admin/dashboard')
                ? isDark
                  ? 'bg-[#5D4037] text-white shadow-md'
                  : 'bg-yellow-50 text-[#5D4037] shadow-md'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="font-semibold text-sm">Dashboard</span>
          </Link>

          {/* Divider */}
          <div className={`mb-6 ${isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}></div>

          {/* Main Menu */}
          <nav className="space-y-1 mb-8">
            <p className={`text-xs font-semibold tracking-widest uppercase mb-4 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Gestión
            </p>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? isDark
                        ? 'bg-[#5D4037] text-white shadow-md'
                        : 'bg-yellow-50 text-[#5D4037] shadow-md'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon active={active} isDark={isDark} />
                  <span className={`font-medium text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}></div>

          {/* Additional Options */}
          <div className="mt-8">
            <p className={`text-xs font-semibold tracking-widest uppercase mb-4 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Más
            </p>
            <div className="space-y-1">
              {additionalItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a
                    key={index}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isDark
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon isDark={isDark} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className={`border-t px-6 py-6 space-y-4 ${isDark ? 'border-gray-800 bg-gray-800 bg-opacity-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
              isDark ? 'bg-[#5D4037] text-white' : 'bg-yellow-100 text-[#5D4037]'
            }`}>
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {user?.name || 'Administrador'}
              </p>
              <p className={`text-xs truncate transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                {user?.email || 'admin@liberapalabras.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}

import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const IconDashboard = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconPublish = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconAnalytics = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconProfile = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
  </svg>
);

const IconMessages = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconDownload = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function CollaboratorSidebar() {
  const { isDark } = useContext(ThemeContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { icon: IconDashboard, label: 'Dashboard', path: '/collaborator/dashboard' },
    { icon: IconPublish, label: 'Nueva Publicación', path: '/collaborator/create' },
    { icon: IconPublish, label: 'Mis Publicaciones', path: '/collaborator/publications' },
    { icon: IconAnalytics, label: 'Estadísticas', path: '/collaborator/analytics' },
    { icon: IconProfile, label: 'Perfil', path: '/collaborator/profile' },
  ];

  const additionalItems = [
    { icon: IconMessages, label: 'Mensajes', path: '#' },
    { icon: IconDownload, label: 'Descargas', path: '#' },
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
            to="/collaborator/dashboard"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-6 ${
              isActive('/collaborator/dashboard')
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
              Menú Principal
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
        <div className={`border-t px-6 py-6 ${isDark ? 'border-gray-800 bg-gray-800 bg-opacity-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
              isDark ? 'bg-[#5D4037] text-white' : 'bg-yellow-100 text-[#5D4037]'
            }`}>
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Colaborador
              </p>
              <p className={`text-xs truncate transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                collab@liberapalabras.com
              </p>
            </div>
          </div>
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

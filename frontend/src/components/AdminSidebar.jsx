import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getCommentReportsCount } from '../services/api';

const IconModeration = ({ active, isDark }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L15.09 8.26H22L17.55 12.7L18.91 18.26L12 14.01L5.09 18.26L6.45 12.7L2 8.26H8.91L12 2Z" />
  </svg>
);

const IconPublish = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconAuthors = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M16 3.5h5" />
    <path d="M18.5 1v5" />
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

const IconFocusGroup = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconComments = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconHomeContent = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const IconInvite = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IconHealth = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default function AdminSidebar() {
  const { isDark } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Arranca cerrado: en escritorio da igual (el panel es `md:static
  // md:translate-x-0`, siempre visible), pero en móvil este estado es el cajón
  // superpuesto, y abrirlo de entrada tapaba el dashboard nada más entrar.
  const [isOpen, setIsOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // El contador de reportes se consulta una vez por montaje: es una agregación
  // `count()` de Firestore, así que no descarga documentos.
  useEffect(() => {
    let cancelled = false;

    getCommentReportsCount()
      .then((response) => {
        if (!cancelled && response.ok) {
          setPendingReports(response.pendingCount || 0);
        }
      })
      .catch(() => {
        // Un fallo aquí solo significa que no se pinta el contador.
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const menuItems = [
    // El administrador siempre pudo publicar obra —AUTHOR_ROLES lo incluye—,
    // pero no había forma de llegar al formulario desde su propio panel.
    { icon: IconPublish, label: 'Publicar obra', path: '/collaborator/create' },
    { icon: IconPublish, label: 'Columnas de Opinión', path: '/admin/columnas' },
    { icon: IconModeration, label: 'Moderación de obras', path: '/admin/moderation' },
    { icon: IconComments, label: 'Comentarios reportados', path: '/admin/comentarios', badge: pendingReports },
    { icon: IconAuthors, label: 'Autores', path: '/admin/autores' },
    { icon: IconUsers, label: 'Usuarios', path: '/admin/users' },
    { icon: IconInvite, label: 'Invitaciones', path: '/admin/invitaciones' },
    { icon: IconFiles, label: 'Archivos', path: '/admin/files' },
    { icon: IconBooks, label: 'Venta de Libros', path: '/admin/publishbook' },
    { icon: IconMagazine, label: 'Revista Poleversia', path: '/admin/poleversia' },
    { icon: IconFocusGroup, label: 'Grupo Focal', path: '/admin/grupo-focal' },
    { icon: IconContest, label: 'Convocatorias', path: '/admin/concursos' },
    { icon: IconContest, label: 'Calificar Concursos', path: '/concursos/panel' },
  ];

  const additionalItems = [
    { icon: IconHomeContent, label: 'Portada del sitio', path: '/admin/home' },
    { icon: IconHealth, label: 'Estado del sistema', path: '/admin/salud' },
    { icon: IconSettings, label: 'Configuración', path: '/admin/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 md:hidden bg-brand-700 text-white p-3 rounded-full shadow-lg hover:bg-brand-800 transition-colors"
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
                  ? 'bg-brand-700 text-white shadow-md'
                  : 'bg-yellow-50 text-brand-700 shadow-md'
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
                        ? 'bg-brand-700 text-white shadow-md'
                        : 'bg-yellow-50 text-brand-700 shadow-md'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon active={active} isDark={isDark} />
                  <span className={`flex-1 font-medium text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}></div>

          {/* Additional Options */}
          <div className="mt-8">
            <p className={`text-xs font-semibold tracking-widest uppercase mb-4 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Sitio y sistema
            </p>
            <div className="space-y-1">
              {additionalItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? isDark
                          ? 'bg-brand-700 text-white shadow-md'
                          : 'bg-yellow-50 text-brand-700 shadow-md'
                        : isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon isDark={isDark} />
                    <span className={`font-medium text-sm ${active ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className={`border-t px-6 py-6 space-y-4 ${isDark ? 'border-gray-800 bg-gray-800 bg-opacity-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
              isDark ? 'bg-brand-700 text-white' : 'bg-yellow-100 text-brand-700'
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

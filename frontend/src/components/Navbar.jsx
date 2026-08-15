import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, UserCog, LogOut, ChevronDown } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, homeRouteForRole, profileRouteForRole } from '../utils/roles';
import NotificationBell from './NotificationBell';
import GenreNavMenu, { GenreNavAccordion } from './GenreNavMenu';
import logo from '../assets/Libera-Palabras.ico';

export default function Navbar() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Se guarda *qué* URL falló, no un booleano: así, si el usuario cambia su
  // foto, la nueva se intenta cargar sin necesidad de resetear nada a mano.
  const [failedPhotoUrl, setFailedPhotoUrl] = useState(null);
  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);


  // Cada rol tiene su propio punto de partida, y el del juez no se llama
  // "dashboard" en ninguna parte de la app: es su panel de calificación.
  const dashboardPath = homeRouteForRole(user?.role);
  const dashboardLabel = user?.role === 'judge' ? 'Panel de Calificación' : 'Dashboard';

  // El perfil vive en dos rutas: la de autoría (admin, colaborador y juez) y la
  // del área de usuario. Cada rol tiene que ir a la suya o la guardia lo rebota.
  const profilePath = profileRouteForRole(user?.role);

  const avatarInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();
  const showAvatarPhoto = Boolean(user?.photoURL) && failedPhotoUrl !== user.photoURL;

  const renderAvatar = (size) => (
    showAvatarPhoto ? (
      <img
        src={user.photoURL}
        alt=""
        onError={() => setFailedPhotoUrl(user.photoURL)}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    ) : (
      <span
        className={`${size} rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold`}
        style={{ backgroundColor: 'var(--color-brand-700)' }}
      >
        {avatarInitial}
      </span>
    )
  );

  return (
    <>
      {/* Altura fija en vez de padding vertical: así mide siempre lo mismo que
          reserva el body en index.css y no queda hueco debajo. El borde entra
          dentro de esos 64/80px porque Tailwind usa `border-box`. */}
      <nav className={`fixed top-0 left-0 right-0 w-full h-16 sm:h-20 flex items-center px-4 sm:px-8 transition-colors z-50 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'} border-b`}>
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          {/* Logo. Sigue siendo el enlace al inicio, igual que antes.

              El logotipo ya trae el nombre dibujado dentro, así que sustituye a
              la vez al recuadro azul y al texto: dejar el libro genérico al lado
              de un logo que ya lleva su propio libro abierto se veía repetido. */}
          <Link
            to="/"
            aria-label="LiberaPalabras, ir al inicio"
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          >
            {/* La placa clara del modo oscuro no es un adorno: el color dominante
                del logo es un verde casi negro (#013015) sobre fondo
                transparente, y contra el gris de la barra (#2e3945) se queda en
                1,2:1 de contraste, o sea invisible. */}
            <img
              src={logo}
              alt="LiberaPalabras"
              className={`h-10 sm:h-12 w-auto ${isDark ? 'bg-gray-50 rounded-lg px-2 py-1' : ''}`}
            />
          </Link>

          {/* Navigation Links - Hidden on mobile.
              `relative` para que los paneles de GenreNavMenu se anclen a esta
              fila y no al enlace que los abre: así se despliegan a todo el
              ancho, de "Inicio" a "Grupo Focal", en vez de como un cuadro
              colgando del botón. */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 relative">
            <Link to="/" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'}`}>
              Inicio
            </Link>
            <GenreNavMenu label="Libros" basePath="/literature" allLabel="Todo el catálogo" isDark={isDark} />
            <GenreNavMenu label="Literatura" basePath="/stories" allLabel="Toda la biblioteca" isDark={isDark} />
            <Link to="/authors" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'}`}>
              Autores
            </Link>
            <Link to="/concursos" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'}`}>
              Concursos
            </Link>
            <Link to="/columnas" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'}`}>
              Columnas
            </Link>
            <Link to="/poleversia" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'}`}>
              Revista Poleversia
            </Link>
            <Link to="/grupo-focal" className={`text-xs lg:text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'}`}>
              Grupo Focal
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
            {/* La campana sí se muestra en móvil: los avisos no dependen del
                menú de escritorio, que va oculto por debajo de `sm`. */}
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              <div className="hidden sm:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menú de usuario"
                  className={`flex items-center gap-1.5 p-1 pr-2 rounded-full border transition-colors ${
                    isDark
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {renderAvatar('w-8 h-8 text-sm')}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''} ${
                      isDark ? 'text-gray-400' : 'text-brand-700'
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl overflow-hidden animate-modal-panel ${
                      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Quién eres */}
                    <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      {renderAvatar('w-10 h-10 text-base')}
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {user?.name || 'Mi cuenta'}
                        </p>
                        <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {user?.email}
                        </p>
                        {ROLE_LABELS[user?.role] && (
                          <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-gray-800 text-amber-300' : 'bg-amber-50 text-brand-700'
                          }`}>
                            {ROLE_LABELS[user.role]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={dashboardPath}
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                        {dashboardLabel}
                      </Link>
                      <Link
                        to={profilePath}
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <UserCog className="w-4 h-4 flex-shrink-0" />
                        Editar perfil
                      </Link>
                    </div>

                    <div className={`py-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-xs sm:text-sm font-medium transition-colors hidden sm:inline ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-brand-800'}`}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-medium text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors hidden sm:inline"
                  style={{backgroundColor: 'var(--color-brand-700)'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-brand-800)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-brand-700)'}
                >
                  Crear Cuenta
                </Link>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menú móvil. Va `fixed` y anclado justo debajo de la navbar (top-16 /
          sm:top-20, la altura de esta): si se dejara en el flujo normal se
          quedaría pegado al principio del documento y, con la página bajada,
          se abriría fuera de la pantalla. El `max-h` lo hace desplazable por
          dentro, porque al ser fijo ya no puede alargar la página. */}
      {isMenuOpen && (
        <div
          className={`md:hidden fixed left-0 right-0 top-16 sm:top-20 z-40 border-b shadow-lg max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}>
              Inicio
            </Link>
            <GenreNavAccordion label="Libros" basePath="/literature" isDark={isDark} onNavigate={() => setIsMenuOpen(false)} />
            <GenreNavAccordion label="Literatura" basePath="/stories" isDark={isDark} onNavigate={() => setIsMenuOpen(false)} />
            <Link to="/authors" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}>
              Autores
            </Link>
            <Link to="/concursos" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}>
              Concursos
            </Link>
            <Link to="/columnas" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}>
              Columnas
            </Link>
            <Link to="/poleversia" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}>
              Revista Poleversia
            </Link>
            <Link to="/grupo-focal" onClick={() => setIsMenuOpen(false)} className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}>
              Grupo Focal
            </Link>
            <div className="pt-4 space-y-3 border-t" style={{borderColor: isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}}>
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3">
                    {renderAvatar('w-10 h-10 text-base')}
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate transition-colors ${isDark ? 'text-gray-200' : 'text-brand-700'}`}>
                        {user?.name || 'Mi cuenta'}
                      </p>
                      <p className={`text-xs truncate transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={dashboardPath}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    {dashboardLabel}
                  </Link>
                  <Link
                    to={profilePath}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}
                  >
                    <UserCog className="w-4 h-4 flex-shrink-0" />
                    Editar perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
                    style={{backgroundColor: 'var(--color-brand-700)'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-800)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-700)'}
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'}`}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors text-center"
                    style={{backgroundColor: 'var(--color-brand-700)'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-brand-800)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-brand-700)'}
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

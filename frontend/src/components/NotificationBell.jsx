import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';

/**
 * Campana de avisos.
 *
 * Consulta por sondeo cada POLL_MS en vez de abrir un canal en tiempo real: la
 * plataforma publica unas pocas obras al día, así que un aviso que tarda un
 * minuto en aparecer no cambia nada, y evita mantener una conexión abierta por
 * cada pestaña.
 *
 * El sondeo se detiene cuando la pestaña queda en segundo plano. Sin eso, una
 * pestaña olvidada seguiría pegándole al backend indefinidamente.
 */

const POLL_MS = 60000;

const TYPE_ICONS = {
  work_published: '📖',
  work_approved: '✅',
  work_rejected: '📝',
  magazine_published: '📰',
  contest_opened: '🏆',
  role_changed: '👤',
  announcement: '📣',
};

function formatRelativeTime(isoDate) {
  if (!isoDate) return '';

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;

  return new Date(isoDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Al cambiar de cuenta (o al cerrar sesión) el feed se vacía durante el
  // render, no en un efecto: si esperara al efecto, habría un instante en el
  // que el usuario recién entrado vería el contador del anterior.
  const [lastUid, setLastUid] = useState(user?.uid ?? null);

  if ((user?.uid ?? null) !== lastUid) {
    setLastUid(user?.uid ?? null);
    setNotifications([]);
    setUnreadCount(0);
  }

  const load = useCallback(async () => {
    if (!user) return;

    try {
      const response = await getNotifications();

      if (response.ok) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch {
      // Un fallo de red no debe romper la barra de navegación: la campana
      // simplemente conserva lo último que trajo y reintenta al siguiente ciclo.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    load();

    let intervalId = null;

    const startPolling = () => {
      if (intervalId === null) {
        intervalId = setInterval(load, POLL_MS);
      }
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Al volver a la pestaña se refresca de inmediato: esperar hasta un
        // minuto para ver lo que ocurrió mientras no mirabas sería raro.
        load();
        startPolling();
      }
    };

    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, load]);

  // Cerrar al hacer clic fuera o al pulsar Escape.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        panelRef.current && !panelRef.current.contains(event.target)
        && buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);

    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const handleMarkAll = async () => {
    // Optimista: la lista se pinta leída de inmediato y el servidor confirma
    // después. Si falla, el siguiente sondeo restaura el estado real.
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  };

  const handleOpen = async (notification) => {
    setIsOpen(false);

    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markNotificationRead(notification.id);
      } catch {
        load();
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (!user) {
    return null;
  }

  const panelBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative p-2 rounded-lg transition-colors ${
          isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notificaciones"
          className={`absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] flex flex-col rounded-xl border shadow-xl z-50 ${panelBg}`}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <h2 className={`text-sm font-bold ${textMain}`}>Notificaciones</h2>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs font-semibold text-[#5D4037] dark:text-amber-400 hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className={`px-4 py-10 text-center text-sm ${textMuted}`}>Cargando…</div>
            ) : notifications.length === 0 ? (
              <div className={`px-4 py-10 text-center text-sm ${textMuted}`}>
                No tienes notificaciones todavía.
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleOpen(notification)}
                      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors border-b last:border-b-0 ${
                        isDark
                          ? `border-gray-800 hover:bg-gray-800 ${!notification.read ? 'bg-gray-800/40' : ''}`
                          : `border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-amber-50/60' : ''}`
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5" aria-hidden="true">
                        {TYPE_ICONS[notification.type] || '🔔'}
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm font-semibold ${textMain}`}>
                          {notification.title}
                        </span>
                        {notification.body && (
                          <span className={`block text-xs mt-0.5 line-clamp-2 ${textMuted}`}>
                            {notification.body}
                          </span>
                        )}
                        <span className={`block text-[11px] mt-1 ${textMuted}`}>
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>

                      {!notification.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-red-600 mt-2 shrink-0"
                          aria-label="Sin leer"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Loader2, Mail, User, X } from 'lucide-react';
import { getFocusGroupAttendees } from '../services/api';

function formatConfirmedAt(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Lista de quién confirmó asistencia a una cátedra. Se pide al abrir (no viene
 * con el listado de encuentros): son datos personales, y no hace falta
 * cargarlos hasta que un admin realmente quiera verlos.
 */
export default function FocusGroupAttendeesModal({ session, isDark, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return undefined;

    let active = true;
    setLoading(true);
    setError('');

    getFocusGroupAttendees(session.id)
      .then((response) => {
        if (active) setAttendees(response.attendees || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudo cargar la lista de asistentes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!session) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendees-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-modal-overlay"
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full max-w-md max-h-[80vh] rounded-xl border shadow-2xl flex flex-col animate-modal-panel ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className={`flex items-start justify-between gap-4 px-6 py-4 border-b flex-shrink-0 ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="min-w-0">
            <h2 id="attendees-modal-title" className={`text-lg font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Asistentes confirmados
            </h2>
            <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {session.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading && (
            <div className={`flex items-center justify-center gap-3 py-12 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando asistentes…
            </div>
          )}

          {error && !loading && (
            <p className={`text-sm px-4 py-3 rounded-lg ${isDark ? 'bg-rose-950/50 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>
              {error}
            </p>
          )}

          {!loading && !error && attendees.length === 0 && (
            <p className={`text-sm text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Todavía nadie ha confirmado asistencia.
            </p>
          )}

          {!loading && !error && attendees.length > 0 && (
            <ul className="space-y-2">
              {attendees.map((attendee) => (
                <li
                  key={attendee.uid}
                  className={`rounded-lg border px-3.5 py-2.5 ${isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-200 bg-gray-50'}`}
                >
                  <p className={`flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    <User className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    {attendee.name || 'Anónimo'}
                  </p>
                  {attendee.email && (
                    <p className={`flex items-center gap-1.5 mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      {attendee.email}
                    </p>
                  )}
                  <p className={`mt-1 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Confirmó el {formatConfirmedAt(attendee.confirmedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

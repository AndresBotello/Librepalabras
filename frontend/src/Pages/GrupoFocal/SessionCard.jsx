import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MessageSquare, Video } from 'lucide-react';
import { FOCUS_GROUP_TYPES } from '../../services/api';
import { MEETING_STATE_LABELS, meetingState } from '../../config/focusGroup';
import { formatMeetingDate, stateBadgeClasses } from './helpers';

/** La tarjeta de un encuentro, compartida por el listado del grupo focal. */
export default function SessionCard({ session, isDark }) {
  const isSync = session.type === FOCUS_GROUP_TYPES.SYNC;
  const state = isSync ? meetingState(session) : 'abierto';

  return (
    <Link
      to={`/grupo-focal/${session.id}`}
      className={`group flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${
        isDark
          ? 'bg-stone-900/50 border-stone-800 hover:border-amber-500/40'
          : 'bg-white border-stone-200 hover:border-amber-600/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border ${stateBadgeClasses(state, isDark)}`}>
          {isSync ? <Video className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
          {MEETING_STATE_LABELS[state]}
        </span>
      </div>

      <h3 className={`text-xl font-serif font-bold mb-3 leading-snug ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
        {session.title}
      </h3>

      {isSync && session.scheduledAt && (
        <p className={`flex items-center gap-2 text-sm mb-3 ${isDark ? 'text-amber-400' : 'text-brand-700'}`}>
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          <span className="first-letter:uppercase">{formatMeetingDate(session.scheduledAt)}</span>
        </p>
      )}

      <p className={`text-sm leading-relaxed line-clamp-4 flex-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
        {session.description}
      </p>

      <div className={`flex items-center justify-between mt-5 pt-4 border-t text-xs ${isDark ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-500'}`}>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {session.commentsCount || 0} comentarios
        </span>
        <span className="font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
          {isSync ? 'Ver encuentro →' : 'Participar →'}
        </span>
      </div>
    </Link>
  );
}

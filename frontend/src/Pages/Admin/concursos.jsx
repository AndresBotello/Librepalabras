import React, { useContext, useState } from 'react';
import { CheckCircle2, Clock, Loader2, Lock, Trophy } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import useContestCatalog from '../../hooks/useContestCatalog';
import { setContestState } from '../../services/api';

const STATES = [
  {
    value: 'proximamente',
    label: 'Próximamente',
    icon: Clock,
    help: 'Se anuncia en la página pero no recibe inscripciones.',
  },
  {
    value: 'abierto',
    label: 'Abierto',
    icon: CheckCircle2,
    help: 'Los colaboradores pueden inscribir su cuento.',
  },
  {
    value: 'cerrado',
    label: 'Cerrado',
    icon: Lock,
    help: 'Termina la edición y su podio aparece en Ganadores.',
  },
];

export default function AdminConcursos() {
  const { isDark } = useContext(ThemeContext);
  const { contests, loading, setContests } = useContestCatalog();
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);
  const [editions, setEditions] = useState({});

  const editionValue = (contest) => editions[contest.id] ?? contest.edition ?? '';

  const save = async (contest, nextStatus) => {
    setBusyId(contest.id);
    setStatus(null);

    try {
      const response = await setContestState(contest.id, {
        status: nextStatus,
        edition: editionValue(contest),
      });

      if (response.contests) setContests(response.contests);
      setStatus({ type: 'success', message: `"${contest.name}" quedó en estado ${nextStatus}.` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const inputClasses = `px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-amber-500/30 focus:border-amber-500'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-[#5D4037]/20 focus:border-[#5D4037]'
  }`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <main className="flex-1 px-4 sm:px-8 py-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
                Convocatorias
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Decide qué concurso está recibiendo inscripciones. Al cerrar una edición, su
                podio aparece automáticamente en la página de ganadores.
              </p>
            </header>

            {status && (
              <div className={`mb-6 rounded-xl px-4 py-3 text-sm border ${
                status.type === 'success'
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {status.message}
              </div>
            )}

            {loading ? (
              <div className={`flex items-center justify-center gap-3 py-20 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando convocatorias…</span>
              </div>
            ) : (
              <div className="space-y-4">
                {contests.map((contest) => {
                  const busy = busyId === contest.id;

                  return (
                    <div
                      key={contest.id}
                      className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {contest.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {contest.audience}
                          </p>
                        </div>

                        {contest.status === 'cerrado' && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'bg-amber-950/50 text-amber-300' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <Trophy className="w-3 h-3" />
                            <span>En ganadores</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-end gap-4">
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 tracking-wider uppercase ${
                            isDark ? 'text-gray-300' : 'text-[#5D4037]'
                          }`}>
                            Edición
                          </label>
                          <input
                            type="text"
                            value={editionValue(contest)}
                            onChange={(event) => setEditions((previous) => ({
                              ...previous,
                              [contest.id]: event.target.value,
                            }))}
                            maxLength={40}
                            placeholder="2026"
                            className={`${inputClasses} w-28`}
                          />
                        </div>

                        {/* El estado se guarda al pulsarlo: es un solo campo y
                            así no queda un botón "Guardar" para cada tarjeta. */}
                        <div className="flex flex-wrap gap-2">
                          {STATES.map(({ value, label, icon: Icon, help }) => {
                            const active = contest.status === value;

                            return (
                              <button
                                key={value}
                                type="button"
                                title={help}
                                disabled={busy}
                                onClick={() => save(contest, value)}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 border ${
                                  active
                                    ? 'bg-[#5D4037] text-white border-[#5D4037]'
                                    : isDark
                                      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                {busy && active ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Icon className="w-4 h-4" />
                                )}
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <p className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {STATES.find((state) => state.value === contest.status)?.help}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

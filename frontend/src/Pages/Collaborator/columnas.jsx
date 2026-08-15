import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AreaSidebar from '../../components/AreaSidebar';
import OpinionColumnsManager from '../../components/OpinionColumnsManager';

export default function OpinionColumnsPage() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AreaSidebar />

        <main className={`flex-1 px-5 py-8 sm:px-8 lg:px-10 ${isDark ? 'bg-gray-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
          <div className="mx-auto max-w-7xl space-y-8">
            <header className={`rounded-[28px] border p-6 shadow-sm sm:p-8 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-amber-300' : 'text-brand-700'}`}>Sección editorial</p>
                  <h1 className={`mt-3 text-4xl font-black tracking-tight sm:text-5xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Columnas de Opinión
                  </h1>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                  {isAdmin ? 'Modo administrador' : 'Modo autor'}
                </div>
              </div>
              <p className={`mt-4 max-w-3xl text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Publica textos con tono editorial, gestiona revisiones y mantiene cada columna con un estilo profesional, claro y periodístico.
              </p>
            </header>

            <OpinionColumnsManager />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

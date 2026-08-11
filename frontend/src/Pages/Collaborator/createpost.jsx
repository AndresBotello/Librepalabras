import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useNotify } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';
import LiteraryWorkForm from '../../components/LiteraryWorkForm';

export default function CreatePost() {
  const { isDark } = useContext(ThemeContext);
  const notify = useNotify();

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Crear Obra Literaria
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Publica tu obra para que la comunidad la disfrute. Será revisada por nuestro equipo editorial.
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-2xl">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-2xl mb-2">✨</div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Preservamos el formato
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Tu texto se mostrará exactamente como lo escribas
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-2xl mb-2">✅</div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Revisión editorial
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Nuestro equipo revisa antes de publicar
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-2xl mb-2">💰</div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Monetiza tu obra
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Vende tu PDF o comparte gratis
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className={`rounded-lg p-8 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <LiteraryWorkForm isDark={isDark} onSuccess={() => {
                  notify.success('¡Obra enviada correctamente! Será revisada pronto.');
                }} />
              </div>

              {/* Guidelines */}
              <div className={`mt-8 p-6 rounded-lg transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  📋 Guías de Publicación
                </h3>
                <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>✓ Mínimo 100 caracteres de contenido</li>
                  <li>✓ Se preserva el formato exacto (saltos de línea, espacios, etc.)</li>
                  <li>✓ Todos los géneros son bienvenidos</li>
                  <li>✓ Puedes elegir si quieres vender o compartir gratis</li>
                  <li>✓ Precio mínimo para venta: $0.99</li>
                  <li>✓ Revisión típica: 24-48 horas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

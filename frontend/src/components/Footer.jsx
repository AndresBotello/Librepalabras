import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export default function Footer() {
  const { isDark } = useContext(ThemeContext);

  return (
    <footer className={`w-full py-8 px-8 border-t transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{backgroundColor: '#5D4037'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6C2 4.89543 2.89543 4 4 4H12V18C12 19.1046 11.1046 20 10 20H4C2.89543 20 2 19.1046 2 18V6Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M22 6C22 4.89543 21.1046 4 20 4H12V18C12 19.1046 12.8954 20 14 20H20C21.1046 20 22 19.1046 22 18V6Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className={`font-semibold text-sm tracking-wide transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>Librepalabras</span>
            </div>
            <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-[#5D4037]'}`}>
              Conecta con la comunidad literaria más vibrante del Valle del César.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className={`font-semibold text-sm mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>Plataforma</h3>
            <ul className="space-y-2">
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Explorar</a></li>
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Comunidad</a></li>
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Literatura</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className={`font-semibold text-sm mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>Empresa</h3>
            <ul className="space-y-2">
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Sobre nosotros</a></li>
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Blog</a></li>
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Contacto</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={`font-semibold text-sm mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Privacidad</a></li>
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Términos</a></li>
              <li><a href="#" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>Ayuda</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={`border-t pt-6 flex flex-col md:flex-row items-center justify-between transition-colors ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
          <p className={`text-xs transition-colors ${isDark ? 'text-gray-400' : 'text-[#5D4037]'}`}>
            © 2026 Librepalabras - Valledupar, Colombia. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className={`text-xs transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>
              Twitter
            </a>
            <a href="#" className={`text-xs transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>
              Facebook
            </a>
            <a href="#" className={`text-xs transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-[#5D4037]'}`}>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

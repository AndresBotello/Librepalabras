import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Home() {
  const { isDark } = useContext(ThemeContext);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative w-full min-h-80 sm:h-96 flex items-center justify-center text-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045359/69478894-7be6-4384-be37-40fc593636eb_xuegr6.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="px-4 sm:px-8 max-w-3xl">
          <span className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            ✨ Bienvenido a Valledupar
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            Donde las palabras
            <br />
            <span className="text-yellow-400 italic">encuentran su libertad</span>
          </h1>
          <p className="text-gray-200 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
            Descubre el lado literario del César a través de sus autores, reseñas y diálogos profundizando sobre nuestra cultura.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="bg-[#5D4037] hover:bg-[#4A302A] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Comenzar lectura
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors">
              Conocer autores
            </button>
          </div>
        </div>
      </section>

      {/* Nuestras Secciones */}
      <section className={`py-12 sm:py-16 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <span className={`text-sm font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Nuestras Secciones
          </span>
          <h2 className={`text-4xl font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Curaduría Literaria Local
          </h2>
          <p className={`text-lg mb-12 max-w-2xl transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Explora los diferentes espacios de expresión que Liberapalabras ofrece para la comunidad del César y el mundo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group">
              <div className="overflow-hidden rounded-lg mb-4 h-48">
                <img
                  src="https://images.unsplash.com/photo-1507842747716-6fed3c493e2a?w=400&h=300&fit=crop"
                  alt="Revista Poliversia"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Publicación Periódica
              </span>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Revista Poliversia
              </h3>
              <p className={`text-sm mb-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Un diálogo multidisciplinario entre la literatura, el arte y el pensamiento crítico
              </p>
              <a href="#" className={`text-sm font-semibold transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Explorar sección →
              </a>
            </div>

            {/* Card 2 */}
            <div className="group">
              <div className="overflow-hidden rounded-lg mb-4 h-48">
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop"
                  alt="Libros y Relatos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Colección Editorial
              </span>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Libros y Relatos
              </h3>
              <p className={`text-sm mb-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Nuestra biblioteca digital de obras completas y antologías de nuevos
              </p>
              <a href="#" className={`text-sm font-semibold transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Explorar sección →
              </a>
            </div>

            {/* Card 3 */}
            <div className="group">
              <div className="overflow-hidden rounded-lg mb-4 h-48">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop"
                  alt="Grupo Focal"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Espacio de Debate
              </span>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Grupo Focal
              </h3>
              <p className={`text-sm mb-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Mesas de diálogo y clubes de lectura donde la comunidad se encuentra para
              </p>
              <a href="#" className={`text-sm font-semibold transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Explorar sección →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Autores Destacados */}
      <section className={`py-12 sm:py-16 px-4 sm:px-8 transition-colors font-inter ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className={`text-sm font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Protagonistas
            </span>
            <h2 className={`text-4xl font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Autores Destacados
            </h2>
            <p className={`text-lg transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Perfiles de los escritores y colaboradores que dan vida a nuestro catálogo editorial
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Author 1 */}
            <div className="text-center group cursor-pointer">
              <div className={`w-32 h-32 mx-auto mb-4 overflow-hidden transition-transform group-hover:scale-105 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop"
                  alt="Gabriel García"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Escritor
              </span>
              <h3 className={`text-lg font-bold mb-2 transition-colors font-inter ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Gabriel García Márquez
              </h3>
              <p className={`text-sm mb-4 italic transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                El maestro del realismo mágico cuya magia rodea todos nuestros
              </p>
              <a href="#" className={`text-sm font-semibold transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Ver perfil completo →
              </a>
            </div>

            {/* Author 2 */}
            <div className="text-center group cursor-pointer">
              <div className={`w-32 h-32 mx-auto mb-4 overflow-hidden transition-transform group-hover:scale-105 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                  alt="Laura Restrepo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Poeta
              </span>
              <h3 className={`text-lg font-bold mb-2 transition-colors font-inter ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Laura Restrepo
              </h3>
              <p className={`text-sm mb-4 italic transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Voces que resuenan en la profundidad de la narrativa colombiana
              </p>
              <a href="#" className={`text-sm font-semibold italic transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Ver perfil completo →
              </a>
            </div>

            {/* Author 3 */}
            <div className="text-center group cursor-pointer">
              <div className={`w-32 h-32 mx-auto mb-4 overflow-hidden transition-transform group-hover:scale-105 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"
                  alt="Manuel Zapata"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Crítico Literario
              </span>
              <h3 className={`text-lg font-bold mb-2 transition-colors font-inter ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Manuel Zapata Olivella
              </h3>
              <p className={`text-sm mb-4 italic transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Investigador incesante del pasado, futuro de los poderes
              </p>
              <a href="#" className={`text-sm font-semibold italic transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Ver perfil completo →
              </a>
            </div>

            {/* Author 4 */}
            <div className="text-center group cursor-pointer">
              <div className={`w-32 h-32 mx-auto mb-4 overflow-hidden transition-transform group-hover:scale-105 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop"
                  alt="Piedad Bonnett"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Memorialista
              </span>
              <h3 className={`text-lg font-bold mb-2 transition-colors font-inter ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Piedad Bonnett
              </h3>
              <p className={`text-sm mb-4 italic transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Testimonios de la complejidad de una poesía y crítica
              </p>
              <a href="#" className={`text-sm font-semibold italic transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Ver perfil completo →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Manifiesto Editorial */}
      <section className={`py-12 sm:py-16 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <div className={`rounded-lg p-6 sm:p-12 relative overflow-hidden transition-colors ${isDark ? 'bg-gray-800' : 'bg-[#5D4037]'}`}>
            {/* Icon */}
            <div className="absolute top-8 right-8 text-6xl opacity-20">
              📖
            </div>

            <span className={`text-sm font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-300'}`}>
              Manifiesto Editorial Liberapalabras
            </span>
            <h2 className={`text-4xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-white'}`}>
              ¿Eres autor o tienes una historia que contar?
            </h2>
            <p className={`text-lg mb-8 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-100'} max-w-2xl`}>
              Buscamos constantemente nuevas voces que enriquezcan nuestro ecosistema literario. Únete a nuestro panel de colaboradores hoy mismo.
            </p>

            <div className="flex gap-4 flex-wrap">
              <button className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isDark ? 'border-2 border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-2 border-white text-white hover:bg-white hover:text-[#5D4037]'}`}>
                Regístrate como Autor
              </button>
              <button className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isDark ? 'bg-[#5D4037] text-white hover:bg-[#4A302A]' : 'bg-white text-[#5D4037] hover:bg-gray-100'}`}>
                Saber más
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

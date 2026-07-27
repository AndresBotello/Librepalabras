import React, { useState, useContext } from 'react';
import { Search, Sliders, Grid, List, Bookmark } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';

export default function Literature() {
  const { isDark } = useContext(ThemeContext);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const sections = [
    {
      id: 1,
      title: 'Revista Poliversia',
      description: 'Nuestra publicación insignia donde la voz de nuestros autores océano vive, ensayos, crítica y análisis que expanden la literatura.',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop',
      category: 'Publicación Periódica',
      link: 'Explorar sección'
    },
    {
      id: 2,
      title: 'Colección de Libros',
      description: 'Un catálogo curático de obras maestras y nuevos voces. Desde la prensa clásica hasta la contemporánea con acceso digital.',
      image: 'https://images.unsplash.com/photo-1507842747716-6fed3c493e2a?w=400&h=300&fit=crop',
      category: 'Biblioteca Digital',
      link: 'Explorar sección'
    },
    {
      id: 3,
      title: 'Grupo Focal Literario',
      description: 'El espacio de nuestra comunidad. Espacios de debate, talleres de escritura y encuentros presenciales y virtuales.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      category: 'Comunidad',
      link: 'Explorar sección'
    }
  ];

  const features = [
    { id: 1, icon: '📖', title: 'Recetas Recientes', description: 'Expresa contenido actualizado semanal por nuestro comité editorial y colaboradores.' },
    { id: 2, icon: '✦', title: 'Nuevas Voces', description: 'Expresa contenido actualizado semanal por nuestro comité editorial y colaboradores.' },
    { id: 3, icon: '📋', title: 'Agenda Cultural', description: 'Expresa contenido actualizado semanal por nuestro comité editorial y colaboradores.' },
    { id: 4, icon: '👤', title: 'Horas de Crítica', description: 'Expresa contenido actualizado semanal por nuestro comité editorial y colaboradores.' }
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative w-full py-16 sm:py-24 lg:py-32 flex items-center justify-start"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%), url(https://res.cloudinary.com/dtuyckctv/image/upload/v1785045359/69478894-7be6-4384-be37-40fc593636eb_xuegr6.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className={`max-w-xl p-8 sm:p-12 rounded-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`inline-block px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 transition-colors ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-[#5D4037]'}`}>
              Exploración Cultural
            </div>

            <h1 className={`text-4xl sm:text-5xl font-bold mb-6 leading-tight transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`}>
              Nuestra <span className="italic font-serif">Literatura</span>
            </h1>

            <p className={`text-base mb-8 leading-relaxed transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Un viaje a través de las letras que definen nuestro territorio. Descubre publicaciones, archivos históricos y comunidades que mantienen viva la llama de la palabra escrita.
            </p>

            <div className="flex gap-4 flex-wrap items-center">
              <button className="px-6 py-3 rounded-lg font-semibold transition-colors text-white" style={{ backgroundColor: '#5D4037' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#4A302A'} onMouseLeave={(e) => e.target.style.backgroundColor = '#5D4037'}>
                Explorar Sección
              </button>
              <button className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
                ✨ Suscripción gratuita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Secciones Destacadas */}
      <section className={`py-16 sm:py-20 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Secciones Destacadas
            </h2>
            <p className={`text-lg transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Explora los pilares de Liberapalabras, desde publicaciones académicas hasta espacios de discusión comunitaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sections.map(section => (
              <div key={section.id} className="group cursor-pointer">
                <div className="overflow-hidden rounded-lg mb-6 h-48 sm:h-56">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {section.category}
                </span>
                <h3 className={`text-2xl font-bold mb-3 font-serif transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {section.title}
                </h3>
                <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {section.description}
                </p>
                <a href="#" className={`text-sm font-semibold transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                  {section.link} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className={`py-20 sm:py-28 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-900' : 'bg-[#f5f0eb]'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <div className={`text-7xl mb-8 opacity-20 transition-colors ${isDark ? 'text-gray-600' : 'text-[#5D4037]'}`} style={{fontFamily: "'Playfair Display', serif"}}>
            "
          </div>
          <p className={`text-3xl sm:text-4xl mb-8 leading-relaxed italic transition-colors ${isDark ? 'text-gray-100' : 'text-[#5D4037]'}`} style={{fontFamily: "'Playfair Display', serif", fontWeight: 400, letterSpacing: '-0.5px'}}>
            La literatura es el arte de la palabra, en puentes invisibles que une los muros de Valledupar con la realidad del mundo.
          </p>
          <p className={`text-xs font-light tracking-widest transition-colors ${isDark ? 'text-gray-500' : 'text-[#8B6F47]'}`}>
            EDITORIAL LIBERAPALABRAS
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className={`py-16 sm:py-20 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-lg border p-6 sm:p-8 transition-colors ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`text-xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Búsqueda Avanzada
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="relative sm:col-span-2">
                <Search className={`absolute left-3 top-3 w-5 h-5 transition-colors ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="En Criterio del Valle, Gabriela García..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-gray-600 focus:border-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-gray-900 focus:border-gray-900'}`}
                />
              </div>

              <button className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors text-sm ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}>
                <Sliders className="w-4 h-4" />
                Filtros
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? (isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-gray-900') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? (isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-gray-900') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button className={`p-2 rounded transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* El Legado de Valledupar */}
      <section className={`py-16 sm:py-20 px-4 sm:px-8 transition-colors ${isDark ? 'bg-gray-900' : 'bg-[#f5f0eb]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className={`text-4xl font-bold mb-4 font-serif transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                El Legado de Valledupar
              </h2>
              <p className={`text-base leading-relaxed mb-8 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Nuestra ciudad no solo es cuna de música; es encuentro de narrativa oral que se ha transformado en una vibrante tradición escrita. Liberapalabras preserva este patrimonio narrativo de la nueva generación de narradores.
              </p>

              <div className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                ARCHIVOS DIGITALES
              </div>
              <p className={`text-3xl font-bold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                1,200+
              </p>

              <div className={`text-xs font-semibold tracking-widest uppercase transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                AUTORES REGISTRADOS
              </div>
              <p className={`text-3xl font-bold mb-8 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                450
              </p>

              <button className={`text-sm font-semibold transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-700'}`}>
                Vea Informe de Impacto Cultural →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {features.map(feature => (
                <div key={feature.id} className={`transition-colors`}>
                  <div className={`w-12 h-12 flex items-center justify-center rounded mb-6 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} style={{fontSize: '1.5rem'}}>
                    {feature.icon}
                  </div>
                  <h4 className={`font-semibold mb-2 text-base transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {feature.title}
                  </h4>
                  <p className={`text-sm leading-relaxed transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-12 p-6 sm:p-8 border rounded-lg transition-colors ${isDark ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <h4 className={`font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              PUBLICACIONES POLIVERSIA
            </h4>
            <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              2k Números
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

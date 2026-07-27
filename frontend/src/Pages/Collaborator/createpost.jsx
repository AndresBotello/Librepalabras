import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollaboratorSidebar from '../../components/CollaboratorSidebar';

export default function CreatePost() {
  const { isDark } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    type: 'poema',
    title: '',
    description: '',
    content: '',
    tags: '',
    file: null,
  });
  const [preview, setPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const postTypes = [
    { id: 'poema', label: 'Poema', icon: '📝', description: 'Composición lírica' },
    { id: 'cuento', label: 'Cuento', icon: '📖', description: 'Narrativa breve' },
    { id: 'lectura', label: 'Lectura', icon: '🎙️', description: 'Recitación o narración' },
    { id: 'ensayo', label: 'Ensayo', icon: '✍️', description: 'Texto argumentativo' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSaveDraft = () => {
    console.log('Guardando borrador...', formData);
    alert('Publicación guardada como borrador');
  };

  const handleSubmitReview = () => {
    if (!formData.title || !formData.content) {
      alert('Por favor completa los campos obligatorios');
      return;
    }
    console.log('Enviando a revisión...', formData);
    alert('Tu publicación ha sido enviada a revisión editorial');
  };

  const currentType = postTypes.find(t => t.id === formData.type);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <CollaboratorSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Nueva Publicación
            </h1>
            <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Comparte tu obra literaria con la comunidad de Liberapalabras
            </p>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-6xl mx-auto">
              {/* Workflow Indicator */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-400 text-gray-900 font-bold text-sm">
                      1
                    </div>
                    <span className={`font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Borrador
                    </span>
                  </div>
                  <div className={`flex-1 h-1 mx-4 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>
                      2
                    </div>
                    <span className={`font-semibold transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      En revisión
                    </span>
                  </div>
                  <div className={`flex-1 h-1 mx-4 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>
                      3
                    </div>
                    <span className={`font-semibold transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Publicado
                    </span>
                  </div>
                </div>
                <p className={`text-xs transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Guarda tu trabajo como borrador, envía a revisión y espera la aprobación editorial
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Type Selection */}
                  <div>
                    <label className={`block text-sm font-bold mb-4 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      Tipo de Publicación
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {postTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                          className={`p-4 rounded-xl transition-all duration-200 text-center ${
                            formData.type === type.id
                              ? isDark
                                ? 'bg-[#5D4037] text-white ring-2 ring-yellow-400'
                                : 'bg-yellow-50 text-[#5D4037] ring-2 ring-yellow-400'
                              : isDark
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-2xl mb-2">{type.icon}</div>
                          <div className="font-semibold text-sm">{type.label}</div>
                          <div className="text-xs opacity-70 mt-1">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      Título *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Ej: La noche de los suspiros"
                      maxLength="100"
                      className={`w-full px-4 py-3 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
                          : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
                      } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formData.title.length}/100 caracteres
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Breve resumen de tu obra..."
                      maxLength="300"
                      rows="3"
                      className={`w-full px-4 py-3 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
                          : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
                      } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 resize-none`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formData.description.length}/300 caracteres
                    </p>
                  </div>

                  {/* Content */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      Contenido *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Escribe tu obra aquí..."
                      rows="10"
                      className={`w-full px-4 py-3 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
                          : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
                      } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 resize-none font-mono text-sm`}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className={`block text-sm font-bold mb-3 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      Adjuntar Archivo (Opcional)
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-gray-700 hover:border-yellow-400 hover:bg-gray-800'
                        : 'border-gray-300 hover:border-yellow-600 hover:bg-gray-50'
                    }`}>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        className="hidden"
                        id="file-input"
                      />
                      <label htmlFor="file-input" className="cursor-pointer block">
                        <div className="text-4xl mb-2">📄</div>
                        <p className={`font-semibold transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {selectedFile ? selectedFile.name : 'Arrastra o haz clic para seleccionar'}
                        </p>
                        <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          PDF, DOC, TXT, JPG, PNG (máx. 10 MB)
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      Etiquetas
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Ej: amor, naturaleza, reflexión (separadas por comas)"
                      className={`w-full px-4 py-3 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-yellow-400'
                          : 'bg-white text-gray-900 border border-gray-300 focus:border-yellow-600'
                      } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50`}
                    />
                  </div>
                </div>

                {/* Sidebar - Preview & Info */}
                <div className="lg:col-span-1">
                  {/* Preview Card */}
                  <div className={`rounded-2xl p-6 transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      Vista Previa
                    </h3>

                    <div className={`p-4 rounded-lg mb-6 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                      <div className="text-2xl mb-2">{currentType?.icon}</div>
                      <h4 className={`font-bold text-sm mb-2 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {formData.title || 'Sin título'}
                      </h4>
                      <p className={`text-xs line-clamp-3 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formData.description || 'Sin descripción'}
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className={`p-4 rounded-lg mb-6 border-l-4 transition-colors ${
                      isDark
                        ? 'bg-yellow-900 bg-opacity-20 border-yellow-400'
                        : 'bg-yellow-50 border-yellow-600'
                    }`}>
                      <p className={`text-xs font-semibold transition-colors ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                        💡 Consejo Editorial
                      </p>
                      <p className={`text-xs mt-2 transition-colors ${isDark ? 'text-yellow-200' : 'text-yellow-700'}`}>
                        Una descripción atractiva aumenta el interés de los lectores. Sé conciso y evocador.
                      </p>
                    </div>

                    {/* Character Count */}
                    <div className={`text-xs space-y-2 mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex justify-between">
                        <span>Palabras de contenido:</span>
                        <span className="font-semibold">{formData.content.split(/\s+/).filter(w => w).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <span className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          Borrador
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={handleSaveDraft}
                        className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                          isDark
                            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        💾 Guardar Borrador
                      </button>
                      <button
                        onClick={handleSubmitReview}
                        disabled={!formData.title || !formData.content}
                        className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDark
                            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        }`}
                      >
                        ✉️ Enviar a Revisión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

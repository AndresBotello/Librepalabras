import React, { useState } from 'react';
import { createLiteraryWork, uploadCover, uploadPdf } from '../services/api';
import genresData from '../config/genres.json';

export default function LiteraryWorkForm({ isDark, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
    content: '',
    tags: '',
    type: 'free',
    price: '',
  });
  const [files, setFiles] = useState({
    cover: null,
    pdf: null,
  });
  const [filePreview, setFilePreview] = useState({
    cover: null,
    pdf: null,
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files?.[0];

    if (!file) return;

    if (name === 'cover') {
      if (!file.type.startsWith('image/')) {
        setError('La portada debe ser una imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('La portada no puede pesar más de 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(prev => ({ ...prev, cover: e.target.result }));
      reader.readAsDataURL(file);
    } else if (name === 'pdf') {
      if (file.type !== 'application/pdf') {
        setError('El archivo debe ser un PDF');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('El PDF no puede pesar más de 50MB');
        return;
      }
      setFilePreview(prev => ({ ...prev, pdf: file.name }));
    }

    setFiles(prev => ({ ...prev, [name]: file }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim() || !formData.genre || !formData.content.trim()) {
      setError('Completa todos los campos requeridos');
      return;
    }

    if (formData.content.length < 100) {
      setError('El contenido debe tener al menos 100 caracteres');
      return;
    }

    if (formData.type === 'pdfSale' && (!formData.price || formData.price < 0.99)) {
      setError('Precio mínimo es $0.99');
      return;
    }

    setLoading(true);
    setUploading(true);
    try {
      let coverUrl = null;
      let pdfUrl = null;

      if (files.cover) {
        coverUrl = await uploadCover(files.cover);
      }

      if (files.pdf) {
        pdfUrl = await uploadPdf(files.pdf);
      }

      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await createLiteraryWork({
        title: formData.title,
        genre: formData.genre,
        description: formData.description,
        content: formData.content,
        tags,
        cover: coverUrl,
        pdfUrl,
        type: formData.type,
        price: formData.type === 'pdfSale' ? parseFloat(formData.price) : null,
      });

      if (response.ok) {
        setSuccess('Obra enviada para revisión. El admin la revisará pronto.');
        setFormData({
          title: '',
          genre: '',
          description: '',
          content: '',
          tags: '',
          type: 'free',
          price: '',
        });
        setFiles({ cover: null, pdf: null });
        setFilePreview({ cover: null, pdf: null });
        if (onSuccess) onSuccess();
      } else {
        setError(response.message || 'Error al crear la obra');
      }
    } catch (err) {
      setError(err.message || 'Error al enviar la obra');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className={`p-4 rounded-lg text-sm border ${isDark ? 'border-red-700 bg-red-900 text-red-200' : 'border-red-300 bg-red-100 text-red-800'}`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`p-4 rounded-lg text-sm border ${isDark ? 'border-green-700 bg-green-900 text-green-200' : 'border-green-300 bg-green-100 text-green-800'}`}>
          {success}
        </div>
      )}

      {/* Título */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Título *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título de tu obra"
          maxLength="100"
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        />
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {formData.title.length}/100
        </p>
      </div>

      {/* Género */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Género *
        </label>
        <select
          name="genre"
          value={formData.genre}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        >
          <option value="">Selecciona un género</option>
          {genresData.genres.map(genre => (
            <option key={genre.value} value={genre.value}>
              {genre.emoji} {genre.label}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Descripción (Resumen)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Resumen de tu obra (100-300 caracteres)..."
          rows={3}
          maxLength="300"
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        />
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {formData.description.length}/300
        </p>
      </div>

      {/* Contenido */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Contenido * (Se preserva el formato)
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Escribe tu obra aquí. Se mantendrá el formato exacto como lo escribas..."
          rows={12}
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 font-mono resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        />
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {formData.content.length} caracteres (mín. 100)
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Etiquetas (separadas por comas)
        </label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="ej: drama, romance, ficción"
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        />
      </div>

      {/* Portada - Upload */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          📖 Portada (Imagen)
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDark
              ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-800'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <input
            type="file"
            name="cover"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="cover-input"
            disabled={uploading}
          />
          <label htmlFor="cover-input" className="cursor-pointer">
            {filePreview.cover ? (
              <div>
                <img
                  src={filePreview.cover}
                  alt="Preview"
                  className="w-20 h-28 object-cover mx-auto rounded mb-2"
                />
                <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {files.cover?.name}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click para cambiar
                </p>
              </div>
            ) : (
              <div>
                <p className={`text-2xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  🖼️
                </p>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sube tu portada
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  PNG, JPG (Máx. 5MB)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* PDF - Upload */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          📄 Archivo PDF
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDark
              ? 'border-gray-600 hover:border-green-500 hover:bg-gray-800'
              : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
          }`}
        >
          <input
            type="file"
            name="pdf"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-input"
            disabled={uploading}
          />
          <label htmlFor="pdf-input" className="cursor-pointer">
            {filePreview.pdf ? (
              <div>
                <p className="text-2xl mb-2">✅</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {filePreview.pdf}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click para cambiar
                </p>
              </div>
            ) : (
              <div>
                <p className={`text-2xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  📑
                </p>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sube tu PDF
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Máximo 50MB
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Tipo de Publicación *
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        >
          <option value="free">Gratis</option>
          <option value="pdfSale">Venta PDF</option>
        </select>
      </div>

      {/* Precio - Si es PDF Sale */}
      {formData.type === 'pdfSale' && (
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Precio USD *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.99"
            min="0.99"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
          />
        </div>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full px-6 py-2 rounded-lg font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Subiendo archivos...' : loading ? 'Enviando...' : 'Enviar para Revisión'}
      </button>
    </form>
  );
}

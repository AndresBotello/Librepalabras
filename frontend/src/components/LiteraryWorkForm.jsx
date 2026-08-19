import React, { useEffect, useRef, useState } from 'react';
import { MAX_PDF_BYTES, createLiteraryWork, formatBytes, getAllAuthors, uploadCover, uploadPdf } from '../services/api';
import { useAuth } from '../context/AuthContext';
import genresData from '../config/genres.json';

export default function LiteraryWorkForm({ isDark, onSuccess }) {
  const { user } = useAuth();
  const ownName = user?.name || '';

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    content: '',
    tags: '',
    type: 'free',
    price: '',
    authorProfileId: '',
  });
  // El catálogo de /authors, para poder asociar la obra a una ficha existente.
  // Si la petición falla no se bloquea nada: el desplegable se queda vacío y la
  // firma sigue siendo el texto libre de siempre.
  const [catalogAuthors, setCatalogAuthors] = useState([]);
  const [files, setFiles] = useState({
    cover: null,
    pdf: null,
  });
  const [filePreview, setFilePreview] = useState({
    cover: null,
    pdf: null,
  });
  // Se guardan para poder vaciarlos al quitar un archivo: si el input conserva
  // el valor, volver a elegir el mismo fichero no dispara `change` —el valor no
  // ha cambiado— y parece que el control se ha quedado muerto.
  const coverInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    getAllAuthors()
      .then((response) => {
        if (!cancelled && response?.ok) setCatalogAuthors(response.authors || []);
      })
      .catch(() => {
        // Silencioso a propósito: asociar es opcional y el formulario funciona
        // igual sin catálogo. Un error rojo aquí solo asustaría.
      });

    return () => { cancelled = true; };
  }, []);

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
      if (file.size > MAX_PDF_BYTES) {
        setError(`El PDF no puede pesar más de ${formatBytes(MAX_PDF_BYTES)}`);
        return;
      }
      setFilePreview(prev => ({ ...prev, pdf: file.name }));
    }

    setFiles(prev => ({ ...prev, [name]: file }));
    setError('');
  };

  // Portada y PDF son opcionales, así que elegirlos tiene que poder deshacerse:
  // sin esto, un clic por error obligaba a recargar la página para volver a
  // enviar la obra sin archivo.
  const handleRemoveFile = (name) => {
    setFiles(prev => ({ ...prev, [name]: null }));
    setFilePreview(prev => ({ ...prev, [name]: null }));

    if (name === 'cover' && coverInputRef.current) {
      coverInputRef.current.value = '';
    } else if (name === 'pdf' && pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
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
        // Vacío significa "fírmala con mi nombre": lo resuelve el backend, que
        // es quien sabe cómo se llama la cuenta.
        author: formData.author.trim(),
        // Vacío = sin asociar. Con ficha, el backend firma la obra con su
        // nombre e ignora el texto libre de arriba.
        authorProfileId: formData.authorProfileId || null,
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
          author: '',
          genre: '',
          description: '',
          content: '',
          tags: '',
          type: 'free',
          price: '',
          authorProfileId: '',
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

  const selectedProfile = catalogAuthors.find(author => author.id === formData.authorProfileId) || null;

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

      {/* Autor del catálogo */}
      <div>
        <label htmlFor="work-author-profile" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Autor registrado <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>(opcional)</span>
        </label>
        <select
          id="work-author-profile"
          name="authorProfileId"
          value={formData.authorProfileId}
          onChange={handleChange}
          disabled={catalogAuthors.length === 0}
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 disabled:opacity-60 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        >
          <option value="">Sin asociar — firmar a mano</option>
          {catalogAuthors.map(author => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {catalogAuthors.length === 0
            ? 'Todavía no hay autores en el catálogo, así que firma la obra a mano abajo.'
            : 'Asóciala a una ficha del catálogo de autores y la obra contará en su página. La obra sigue siendo tuya para editarla y borrarla.'}
        </p>
      </div>

      {/* Autor de la obra */}
      <div>
        <label htmlFor="work-author" className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Autor de la obra
        </label>
        <input
          id="work-author"
          type="text"
          name="author"
          value={selectedProfile ? selectedProfile.name : formData.author}
          onChange={handleChange}
          disabled={Boolean(selectedProfile)}
          placeholder={ownName ? `${ownName} (tú)` : 'Nombre del autor'}
          maxLength="120"
          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 disabled:opacity-60 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
        />
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {selectedProfile
            ? `La firma la pone la ficha elegida: ${selectedProfile.name}. Vuelve a "Sin asociar" para escribirla a mano.`
            : 'Déjalo vacío para firmarla con tu nombre. Escribe otro para publicar la obra de otra persona: la obra aparecerá a nombre de quien indiques, y seguirá siendo tuya para editarla.'}
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
          📖 Portada (opcional)
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDark
              ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-800'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <input
            ref={coverInputRef}
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
                  Sube una portada
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  PNG, JPG (Máx. 5MB)
                </p>
              </div>
            )}
          </label>

          {filePreview.cover && (
            <button
              type="button"
              onClick={() => handleRemoveFile('cover')}
              disabled={uploading}
              className={`mt-2 text-xs font-semibold transition-colors disabled:opacity-50 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Quitar portada
            </button>
          )}
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Sin portada la obra se publica igual: en el catálogo se dibuja una tapa con su título.
        </p>
      </div>

      {/* PDF - Upload */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          📄 Archivo PDF (opcional)
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDark
              ? 'border-gray-600 hover:border-green-500 hover:bg-gray-800'
              : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
          }`}
        >
          <input
            ref={pdfInputRef}
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
                  Sube un PDF
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Máximo {formatBytes(MAX_PDF_BYTES)}
                </p>
              </div>
            )}
          </label>

          {filePreview.pdf && (
            <button
              type="button"
              onClick={() => handleRemoveFile('pdf')}
              disabled={uploading}
              className={`mt-2 text-xs font-semibold transition-colors disabled:opacity-50 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Quitar PDF
            </button>
          )}
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Sin PDF la obra se lee en línea, con el contenido que escribiste arriba.
        </p>
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

import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Loader2, Pencil, Plus, Upload, X, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import { createPromotionalBook, getPromotionalBooks, updatePromotionalBook, uploadCover } from '../../services/api';
import genresData from '../../config/genres.json';

const EMPTY_FORM = {
  title: '',
  author: '',
  genre: '',
  description: '',
  synopsis: '',
  price: '',
  originalPrice: '',
  discount: '',
  isbn: '',
  publisher: '',
  publicationDate: '',
  pages: '',
  language: 'Español',
  availability: 'available',
  tags: '',
};

export default function PublishBook() {
  const { isDark } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverUploadLoading, setCoverUploadLoading] = useState(false);

  // Libros ya publicados: el mismo formulario sirve para crear y para editar,
  // según haya o no un `editingId`.
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const genreLabels = useMemo(
    () => Object.fromEntries(genresData.genres.map(g => [g.value, g.label])),
    []
  );

  const loadBooks = async () => {
    try {
      const response = await getPromotionalBooks();
      setBooks(response.books || []);
    } catch (err) {
      console.error('Error cargando los libros publicados:', err);
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setCoverImage(null);
    setCoverImageFile(null);
    setEditingId(null);
  };

  // Carga el libro en el formulario. Los números y las etiquetas se convierten a
  // texto porque los inputs son controlados y no aceptan otro tipo.
  const startEdit = (book) => {
    setEditingId(book.id);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      genre: book.genre || '',
      description: book.description || '',
      synopsis: book.synopsis || '',
      price: book.price != null ? String(book.price) : '',
      originalPrice: book.originalPrice != null ? String(book.originalPrice) : '',
      discount: book.discount != null ? String(book.discount) : '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationDate: (book.publicationDate || '').slice(0, 10),
      pages: book.pages != null ? String(book.pages) : '',
      language: book.language || 'Español',
      availability: book.availability || 'available',
      tags: (book.tags || []).join(', '),
    });
    setCoverImage(book.coverImage || null);
    setCoverImageFile(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('El archivo debe ser una imagen', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('La imagen no puede pesar más de 5MB', 'error');
      return;
    }

    setCoverUploadLoading(true);
    try {
      const imageUrl = await uploadCover(file);
      setCoverImage(imageUrl);
      setCoverImageFile(file);
      showMessage('Portada subida correctamente', 'success');
    } catch (err) {
      console.error('Error uploading cover:', err);
      showMessage('Error al subir la portada: ' + (err.message || 'Intenta de nuevo'), 'error');
    } finally {
      setCoverUploadLoading(false);
    }
  };

  const validateForm = () => {
    const required = ['title', 'author', 'genre', 'price'];
    for (const field of required) {
      if (!formData[field]?.trim()) {
        showMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} es obligatorio`, 'error');
        return false;
      }
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      showMessage('Precio debe ser un número válido', 'error');
      return false;
    }

    if (formData.originalPrice && isNaN(parseFloat(formData.originalPrice))) {
      showMessage('Precio original debe ser un número válido', 'error');
      return false;
    }

    if (formData.originalPrice && parseFloat(formData.originalPrice) < parseFloat(formData.price)) {
      showMessage('El precio original debe ser mayor que el precio actual', 'error');
      return false;
    }

    if (formData.pages && isNaN(parseInt(formData.pages))) {
      showMessage('Número de páginas debe ser un número válido', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        genre: formData.genre,
        description: formData.description.trim(),
        synopsis: formData.synopsis.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        discount: formData.discount ? parseInt(formData.discount) : null,
        isbn: formData.isbn?.trim() || null,
        publisher: formData.publisher?.trim() || null,
        publicationDate: formData.publicationDate || null,
        pages: formData.pages ? parseInt(formData.pages) : null,
        language: formData.language || 'Español',
        availability: formData.availability || 'available',
        coverImage: coverImage || null,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
      };

      const response = editingId
        ? await updatePromotionalBook(editingId, bookData)
        : await createPromotionalBook(bookData);

      if (response.ok) {
        showMessage(
          editingId ? '✅ Libro actualizado correctamente' : '📚 Libro promocionado creado exitosamente',
          'success'
        );
        resetForm();
        await loadBooks();
      } else {
        showMessage(response.message || 'Error al guardar el libro', 'error');
      }
    } catch (err) {
      console.error('Error:', err);
      showMessage('Error al procesar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <section className={`px-4 sm:px-8 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{backgroundColor: isDark ? '#5D4037' : '#D2691E'}}>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-4xl font-bold mb-2 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Publicar Libro Promocionado
                  </h1>
                  <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Agrega libros físicos para promocionar y vender. Completa todos los campos requeridos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className={`px-4 sm:px-8 py-10 flex-1 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-4xl mx-auto">
              {/* Alert Messages */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 transition-colors ${
                  messageType === 'success'
                    ? isDark
                      ? 'bg-green-950/30 border-green-800 text-green-300'
                      : 'bg-green-50 border-green-300 text-green-800'
                    : isDark
                    ? 'bg-red-950/30 border-red-800 text-red-300'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {messageType === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {/* Libros ya publicados */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Libros publicados
                  </h2>
                  {!booksLoading && books.length > 0 && (
                    <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {books.length} {books.length === 1 ? 'libro' : 'libros'}
                    </span>
                  )}
                </div>

                {booksLoading ? (
                  <div className={`flex items-center justify-center gap-3 py-12 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando libros…
                  </div>
                ) : books.length === 0 ? (
                  <div className={`rounded-lg border-2 border-dashed px-6 py-12 text-center text-sm transition-colors ${
                    isDark ? 'border-gray-800 text-gray-400' : 'border-gray-300 text-gray-600'
                  }`}>
                    <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    Todavía no has publicado ningún libro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {books.map(book => (
                      <div
                        key={book.id}
                        className={`flex gap-4 rounded-lg border p-4 transition-colors ${
                          editingId === book.id
                            ? isDark ? 'bg-amber-950/30 border-amber-700' : 'bg-amber-50 border-amber-400'
                            : isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className={`w-16 h-24 rounded flex-shrink-0 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          {book.coverImage ? (
                            <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className={`w-5 h-5 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <p className={`font-semibold truncate transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`} title={book.title}>
                            {book.title}
                          </p>
                          <p className={`text-sm truncate transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {book.author}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {genreLabels[book.genre] || book.genre}
                            </span>
                            <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              ${Number(book.price || 0).toFixed(2)}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              <Eye className="w-3 h-3" />
                              {book.views || 0}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => startEdit(book)}
                            className={`mt-3 self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isDark
                                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {editingId === book.id ? 'Editando' : 'Editar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              <form ref={formRef} onSubmit={handleSubmit} className={`rounded-lg border-2 p-8 transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                {editingId && (
                  <div className={`mb-8 -mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${
                    isDark ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-800'
                  }`}>
                    <span>
                      Estás editando <strong>{formData.title || 'este libro'}</strong>.
                    </span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`font-semibold underline underline-offset-2 ${isDark ? 'hover:text-amber-200' : 'hover:text-amber-900'}`}
                    >
                      Cancelar edición
                    </button>
                  </div>
                )}
                {/* Portada */}
                <div className="mb-8 pb-8 border-b" style={{borderColor: isDark ? '#2d2d2d' : '#e5e7eb'}}>
                  <label className={`block text-lg font-semibold mb-4 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    📖 Portada del Libro
                  </label>

                  {coverImage ? (
                    <div className="relative mb-4">
                      <img
                        src={coverImage}
                        alt="Portada"
                        className="w-48 h-72 object-cover rounded-lg shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverImageFile(null);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <Upload className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`font-semibold mb-1 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        Sube la portada del libro
                      </p>
                      <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        PNG, JPG hasta 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={coverUploadLoading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Información Básica */}
                <div className="mb-8 pb-8 border-b" style={{borderColor: isDark ? '#2d2d2d' : '#e5e7eb'}}>
                  <h3 className={`text-lg font-semibold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    Información Básica
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Título */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Título *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Ej: El viaje inesperado"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Autor */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Autor *
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        placeholder="Nombre del autor"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Género */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Género *
                      </label>
                      <select
                        name="genre"
                        value={formData.genre}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      >
                        <option value="">Selecciona un género</option>
                        {genresData.genres.map(genre => (
                          <option key={genre.value} value={genre.value}>
                            {genre.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Idioma */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Idioma
                      </label>
                      <input
                        type="text"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        placeholder="Ej: Español"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="mt-6">
                    <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Descripción Breve
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Breve descripción de la promoción (máx. 200 caracteres)"
                      maxLength="200"
                      rows="3"
                      className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    />
                    <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formData.description.length}/200
                    </p>
                  </div>

                  {/* Sinopsis */}
                  <div className="mt-6">
                    <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Sinopsis Completa
                    </label>
                    <textarea
                      name="synopsis"
                      value={formData.synopsis}
                      onChange={handleInputChange}
                      placeholder="Sinopsis completa del libro"
                      rows="5"
                      className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    />
                  </div>
                </div>

                {/* Información de Precios */}
                <div className="mb-8 pb-8 border-b" style={{borderColor: isDark ? '#2d2d2d' : '#e5e7eb'}}>
                  <h3 className={`text-lg font-semibold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    💰 Precios y Descuentos
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Precio Actual */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Precio Actual *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="Ej: 19.99"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Precio Original */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Precio Original
                      </label>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="Ej: 29.99"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Descuento */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        placeholder="Ej: 30"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>
                  </div>
                </div>

                {/* Información Editorial */}
                <div className="mb-8 pb-8 border-b" style={{borderColor: isDark ? '#2d2d2d' : '#e5e7eb'}}>
                  <h3 className={`text-lg font-semibold mb-6 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    📋 Información Editorial
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ISBN */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        ISBN
                      </label>
                      <input
                        type="text"
                        name="isbn"
                        value={formData.isbn}
                        onChange={handleInputChange}
                        placeholder="Ej: 978-3-16-148410-0"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Editorial */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Editorial
                      </label>
                      <input
                        type="text"
                        name="publisher"
                        value={formData.publisher}
                        onChange={handleInputChange}
                        placeholder="Nombre de la editorial"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Fecha de Publicación */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fecha de Publicación
                      </label>
                      <input
                        type="date"
                        name="publicationDate"
                        value={formData.publicationDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Páginas */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Número de Páginas
                      </label>
                      <input
                        type="number"
                        name="pages"
                        value={formData.pages}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Ej: 300"
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                    </div>

                    {/* Disponibilidad */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Disponibilidad
                      </label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      >
                        <option value="available">Disponible</option>
                        <option value="limited">Disponibilidad Limitada</option>
                        <option value="preorder">Pre-orden</option>
                        <option value="unavailable">No disponible</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="mb-8">
                  <label className={`block text-sm font-semibold mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Etiquetas (separadas por comas)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Ej: bestseller, recomendado, clásico"
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading || coverUploadLoading}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors text-white ${
                      isDark
                        ? 'bg-amber-900 hover:bg-amber-800 disabled:opacity-50'
                        : 'bg-amber-700 hover:bg-amber-800 disabled:opacity-50'
                    } disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading
                      ? (editingId ? '⏳ Guardando...' : '⏳ Publicando...')
                      : (editingId ? '💾 Guardar Cambios' : '✅ Publicar Libro')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-semibold border-2 transition-colors ${
                      isDark
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                    } disabled:cursor-not-allowed`}
                  >
                    {editingId ? 'Cancelar' : 'Limpiar'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

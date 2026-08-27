import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { useDialog } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import SocialIcon from '../../components/SocialIcon';
import { detectPlatform, platformLabel } from '../../utils/socialLinks';
import {
  createAuthor,
  deleteAuthor,
  getAllAuthors,
  getAllUsers,
  updateAuthor,
  uploadCoverWithProgress,
} from '../../services/api';

/**
 * El catálogo de autores de /authors. Se arma a mano: publicar obra no mete a
 * nadie aquí, y aquí puede entrar quien no tiene cuenta.
 *
 * Dos caminos para dar de alta, misma ficha al final:
 *   - en blanco, para alguien de fuera de la plataforma;
 *   - a partir de una cuenta, que rellena el formulario con lo que esa persona
 *     ya escribió en su perfil y deja la ficha enlazada para que muestre sus
 *     cifras reales.
 */

const EMPTY_FORM = { name: '', bio: '', photoURL: '', userId: null, links: [] };
const MAX_BIO = 3000; // tiene que coincidir con el tope de author.service.js
const MAX_LINKS = 6;

export default function AdminAutores() {
  const { isDark } = useContext(ThemeContext);
  const { confirm, notify } = useDialog();

  const [authors, setAuthors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);

  // La lectura va aparte de la escritura en el estado para que la use tanto la
  // carga inicial como las recargas de después de guardar.
  const fetchData = useCallback(async () => {
    const [authorsRes, usersRes] = await Promise.all([getAllAuthors(), getAllUsers()]);

    return {
      authors: authorsRes.ok ? authorsRes.authors || [] : [],
      users: usersRes.ok ? usersRes.users || [] : [],
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchData()
      .then((data) => {
        if (cancelled) return;
        setAuthors(data.authors);
        setUsers(data.users);
      })
      .catch((err) => {
        if (!cancelled) notify.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchData, notify]);

  // Al recargar tras guardar no se toca `loading`: dejar la lista puesta evita
  // el parpadeo de vaciarla y volver a pintarla.
  const load = useCallback(async () => {
    try {
      const data = await fetchData();
      setAuthors(data.authors);
      setUsers(data.users);
    } catch (err) {
      notify.error(err.message);
    }
  }, [fetchData, notify]);

  // Solo se ofrecen cuentas que aún no tienen ficha: el backend rechaza el
  // duplicado, pero es mejor no llegar a ofrecerlo.
  const linkableUsers = useMemo(() => {
    const taken = new Set(authors.map((a) => a.userId).filter(Boolean));
    return users.filter((user) => !taken.has(user.uid) || user.uid === form.userId);
  }, [users, authors, form.userId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  };

  const handleField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  /** Trae al formulario lo que la persona ya tiene escrito en su perfil. */
  const prefillFromUser = (uid) => {
    if (!uid) {
      setForm((prev) => ({ ...prev, userId: null }));
      return;
    }

    const user = users.find((candidate) => candidate.uid === uid);
    if (!user) return;

    const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.trim() || user.name || '';

    setForm((prev) => ({
      ...prev,
      name: prev.name || fullName,
      bio: prev.bio || user.descripcion || '',
      photoURL: prev.photoURL || user.photoURL || '',
      userId: uid,
    }));

    if (!user.descripcion) {
      setError(
        'Esa cuenta todavía no tiene biografía en su perfil. Puedes escribirla aquí, '
        + 'o pedirle que la rellene desde su perfil y volver luego.'
      );
    }
  };

  // Los enlaces se editan como filas: una dirección por fila, con un nombre
  // opcional que solo hace falta cuando no es una red conocida (un blog, la
  // página de una editorial…).
  const addLink = () => {
    if (form.links.length >= MAX_LINKS) return;
    setForm((prev) => ({ ...prev, links: [...prev.links, { url: '', label: '' }] }));
  };

  const updateLink = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    }));
    setError(null);
  };

  const removeLink = (index) => {
    setForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    setError(null);

    try {
      const response = await uploadCoverWithProgress(file, setUploadProgress);
      handleField('photoURL', response.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadProgress(null);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        photoURL: form.photoURL,
        userId: form.userId || null,
        // Las filas que quedaron en blanco no se envían: es lo que pasa cuando
        // se pulsa "añadir enlace" y luego se cambia de idea.
        links: form.links.filter((link) => link.url.trim()),
      };

      if (editingId) {
        await updateAuthor(editingId, payload);
        notify.success('Ficha actualizada');
      } else {
        await createAuthor(payload);
        notify.success('Autor añadido al catálogo');
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (author) => {
    setEditingId(author.id);
    setForm({
      name: author.name || '',
      bio: author.description || '',
      photoURL: author.photoURL || '',
      userId: author.userId || null,
      links: (author.links || []).map((link) => ({ url: link.url, label: link.label || '' })),
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (author) => {
    const confirmed = await confirm({
      title: `¿Retirar a ${author.name} del catálogo?`,
      message: 'Dejará de aparecer en la página de Autores.',
      detail: 'No se borra su cuenta ni ninguna de sus obras publicadas.',
      confirmLabel: 'Retirar del catálogo',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteAuthor(author.id);
      notify.success('Autor retirado del catálogo');
      if (editingId === author.id) resetForm();
      await load();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const fieldClass = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;
  const labelClass = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8">
          <header className="mb-8">
            <h1 className={`font-serif text-3xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Catálogo de autores
            </h1>
            <p className={`text-sm max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Esta es la lista que se ve en la página de Autores. Nadie entra solo: publicar obra
              no da entrada al catálogo, y aquí puedes incluir a alguien que no tenga cuenta.
            </p>
          </header>

          {/* Formulario */}
          <section className={`rounded-xl border p-6 mb-8 transition-colors ${cardClass}`}>
            <h2 className={`font-serif text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {editingId ? 'Editar ficha' : 'Añadir autor'}
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label htmlFor="author-user" className={labelClass}>
                  Cuenta enlazada <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>(opcional)</span>
                </label>
                <select
                  id="author-user"
                  value={form.userId || ''}
                  onChange={(event) => prefillFromUser(event.target.value || null)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="">Sin cuenta — autor externo</option>
                  {linkableUsers.map((user) => (
                    <option key={user.uid} value={user.uid}>
                      {user.name || user.email} · {user.email}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Al elegir una cuenta se copian su nombre, biografía y foto, y la ficha pasa a
                  mostrar sus publicaciones y me gusta reales.
                </p>
              </div>

              <div>
                <label htmlFor="author-name" className={labelClass}>Nombre</label>
                <input
                  id="author-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => handleField('name', event.target.value)}
                  className={fieldClass}
                  placeholder="Amhed Escallón Gamarra"
                  maxLength={80}
                  required
                />
              </div>

              <div>
                <label htmlFor="author-bio" className={labelClass}>Biografía</label>
                <textarea
                  id="author-bio"
                  value={form.bio}
                  onChange={(event) => handleField('bio', event.target.value.slice(0, MAX_BIO))}
                  className={`${fieldClass} min-h-56 resize-y leading-relaxed`}
                  placeholder="Quién es, qué escribe y de dónde viene."
                  required
                />
                {/* El contador solo avisa cuando queda poco: con 3000 de tope,
                    tenerlo siempre encendido es ruido durante casi toda la
                    escritura. */}
                <p className={`text-xs mt-1 text-right tabular-nums ${
                  form.bio.length > MAX_BIO * 0.9
                    ? isDark ? 'text-amber-400' : 'text-amber-700'
                    : isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {form.bio.length}/{MAX_BIO}
                </p>
              </div>

              <div>
                <span className={labelClass}>Foto de perfil</span>
                <div className="flex items-center gap-4 flex-wrap">
                  {form.photoURL && (
                    <img
                      src={form.photoURL}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto}
                    disabled={uploadProgress !== null}
                    className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  />
                  {uploadProgress !== null && (
                    <span className={`text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Subiendo… {uploadProgress}%
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className={labelClass}>
                  Redes y páginas <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>(opcional)</span>
                </span>
                <p className={`text-xs mb-2.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Pega la dirección y el icono se reconoce solo. Si no es una red conocida se
                  muestra un icono de página web, y puedes ponerle nombre.
                </p>

                <div className="grid gap-2">
                  {form.links.map((link, index) => {
                    const known = link.url.trim() && detectPlatform(link.url) !== 'website';

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className={`flex-shrink-0 w-9 h-9 rounded-lg grid place-items-center ${
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}
                          title={link.url.trim() ? platformLabel(link.url, link.label) : 'Sin dirección'}
                        >
                          <SocialIcon url={link.url} size={18} />
                        </span>

                        <input
                          type="text"
                          value={link.url}
                          onChange={(event) => updateLink(index, 'url', event.target.value)}
                          className={`${fieldClass} flex-1 min-w-0`}
                          placeholder="instagram.com/suusuario"
                          aria-label={`Dirección del enlace ${index + 1}`}
                        />

                        {/* El nombre solo se pide cuando el dominio no dice de
                            qué es: para Instagram sería ruido. */}
                        {!known && (
                          <input
                            type="text"
                            value={link.label}
                            onChange={(event) => updateLink(index, 'label', event.target.value)}
                            className={`${fieldClass} w-36 flex-shrink-0`}
                            placeholder="Nombre"
                            maxLength={40}
                            aria-label={`Nombre del enlace ${index + 1}`}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          aria-label={`Quitar el enlace ${index + 1}`}
                          className={`flex-shrink-0 w-9 h-9 rounded-lg text-lg leading-none transition-colors ${
                            isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                {form.links.length < MAX_LINKS && (
                  <button
                    type="button"
                    onClick={addLink}
                    className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    + Añadir enlace
                  </button>
                )}
              </div>

              {error && (
                <p className={`text-sm rounded-lg px-3 py-2 ${
                  isDark ? 'bg-rose-950/40 text-rose-300' : 'bg-rose-50 text-rose-800'
                }`}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={saving || uploadProgress !== null}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-700 text-white hover:bg-brand-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Añadir al catálogo'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Listado */}
          <section className={`rounded-xl border p-6 transition-colors ${cardClass}`}>
            <h2 className={`font-serif text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              En el catálogo <span className="tabular-nums font-sans text-base">({authors.length})</span>
            </h2>

            {loading ? (
              <p className={`text-sm py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando…</p>
            ) : authors.length === 0 ? (
              <p className={`text-sm py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                El catálogo está vacío, así que la página de Autores no muestra a nadie todavía.
                Añade la primera ficha con el formulario de arriba.
              </p>
            ) : (
              <ul className="grid gap-3">
                {authors.map((author) => (
                  /* `min-w-0` es imprescindible: como elemento de la rejilla,
                     el `li` nace con `min-width: auto` y se estira hasta caber
                     su contenido. Con una biografía larga eso desbordaba la
                     tarjeta a lo ancho y empujaba los botones fuera de la
                     pantalla. */
                  <li
                    key={author.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors min-w-0 ${
                      isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {author.photoURL ? (
                      <img src={author.photoURL} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex-shrink-0 bg-brand-700 text-white flex items-center justify-center font-semibold">
                        {author.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {author.name}
                      </p>
                      {/* Dos líneas en vez de una recortada: la biografía puede
                          llegar a 3000 caracteres y en una sola línea no se
                          reconoce de quién es la ficha. `line-clamp` además
                          deja que el texto parta, que es lo que evita que
                          vuelva a estirar la fila. */}
                      <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {author.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {author.userId
                            ? `Cuenta enlazada · ${author.publications} obras · ${author.totalLikes} me gusta`
                            : 'Autor externo, sin cuenta'}
                        </p>
                        {author.links?.length > 0 && (
                          <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {author.links.map((link) => (
                              <SocialIcon key={link.url} url={link.url} size={13} />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(author)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-white'
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(author)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-700 hover:bg-rose-50'
                        }`}
                      >
                        Retirar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}

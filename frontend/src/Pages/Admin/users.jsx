import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import EditUserModal from '../../components/EditUserModal';
import { getAllUsers, updateUserRole, getUserById, updateUserById } from '../../services/api';

// Íconos SVG para una estética formal e integrada
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function Users() {
  const { isDark } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllUsers();
      if (response.ok && response.users) {
        setUsers(response.users);
      } else {
        setError('No se pudieron cargar los usuarios.');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    try {
      setUpdating(uid);
      await updateUserRole(uid, newRole);
      setUsers(users.map(u => (u.uid === uid ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError('Error al actualizar rol: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleEditClick = async (uid) => {
    try {
      setModalOpen(true);
      setSavingUser(true);
      const response = await getUserById(uid);
      if (response.ok) {
        setEditingUser(response.user);
      } else {
        setError('No se pudo cargar la información del usuario');
      }
    } catch (err) {
      setError('Error al cargar usuario: ' + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveUser = async (updateData) => {
    try {
      setSavingUser(true);
      await updateUserById(editingUser.uid, updateData);
      setUsers(users.map(u => (u.uid === editingUser.uid ? { ...u, ...updateData } : u)));
      setModalOpen(false);
      setEditingUser(null);
      setError('');
    } catch (err) {
      setError('Error al guardar usuario: ' + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteClick = (uid, name) => {
    setDeleteConfirm({ uid, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setUpdating(deleteConfirm.uid);
      setUsers(users.filter(u => u.uid !== deleteConfirm.uid));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Error al eliminar usuario: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role) => {
    const isAdmin = role === 'admin';
    return isDark
      ? isAdmin
        ? 'bg-rose-950/80 text-rose-300 border-rose-800/50'
        : 'bg-slate-800 text-slate-300 border-slate-700'
      : isAdmin
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-900'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Dashboard Minimalista */}
          <header className={`px-6 lg:px-10 py-6 border-b transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Gestión de Usuarios</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Administra los accesos y roles de la plataforma ({filteredUsers.length} en total)
                </p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 focus:ring-2 focus:ring-slate-400">
                <PlusIcon />
                Nuevo Usuario
              </button>
            </div>
          </header>

          {/* Área Principal de Contenido */}
          <section className="flex-1 px-6 lg:px-10 py-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Barra de Búsqueda Integrada */}
              <div className="relative max-w-md">
                <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Notificación de Error */}
              {error && (
                <div className={`flex items-center gap-3 p-4 rounded-lg border text-sm ${
                  isDark ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}

              {/* Contenedor Principal / Estados */}
              {loading ? (
                <div className={`rounded-xl p-16 text-center border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-3" />
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cargando usuarios...</p>
                </div>
              ) : users.length === 0 ? (
                <div className={`rounded-xl p-16 text-center border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No hay usuarios registrados en el sistema.</p>
                </div>
              ) : (
                /* Tabla de Usuarios Estilizada */
                <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${
                          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          <th className="px-6 py-3.5">Usuario</th>
                          <th className="px-6 py-3.5">Rol</th>
                          <th className="px-6 py-3.5">Fecha Registro</th>
                          <th className="px-6 py-3.5">Estado</th>
                          <th className="px-6 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {paginatedUsers.map((user) => (
                          <tr key={user.uid} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                            {/* Nombre y Email */}
                            <td className="px-6 py-4">
                              <div className="font-medium">{user.name}</div>
                              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</div>
                            </td>

                            {/* Selector de Rol Elegante */}
                            <td className="px-6 py-4">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                disabled={updating === user.uid}
                                className={`text-xs font-medium px-2.5 py-1 rounded-md border focus:outline-none cursor-pointer transition-all ${getRoleBadge(user.role)} ${
                                  updating === user.uid ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="collaborator" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Colaborador</option>
                                <option value="admin" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Admin</option>
                              </select>
                            </td>

                            {/* Fecha */}
                            <td className={`px-6 py-4 whitespace-nowrap text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {formatDate(user.createdAt)}
                            </td>

                            {/* Badge Estado con indicador de punto */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                user.status === 'Activo'
                                  ? isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {user.status}
                              </span>
                            </td>

                            {/* Botones de Acción Inline */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditClick(user.uid)}
                                  title="Editar usuario"
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user.uid, user.name)}
                                  title="Eliminar usuario"
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDark ? 'hover:bg-rose-950/50 text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                                  }`}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t ${
                      isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Mostrando <span className="font-medium text-slate-700 dark:text-slate-300">{startIndex + 1}</span> a{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(startIndex + usersPerPage, filteredUsers.length)}</span> de{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{filteredUsers.length}</span> resultados
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                            currentPage === 1
                              ? 'opacity-40 cursor-not-allowed border-transparent'
                              : isDark
                              ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                              : 'border-slate-200 hover:bg-white text-slate-700 shadow-sm'
                          }`}
                        >
                          Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                                : isDark
                                ? 'hover:bg-slate-800 text-slate-400'
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                            currentPage === totalPages
                              ? 'opacity-40 cursor-not-allowed border-transparent'
                              : isDark
                              ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                              : 'border-slate-200 hover:bg-white text-slate-700 shadow-sm'
                          }`}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Modal de Edición */}
      <EditUserModal
        isOpen={modalOpen}
        user={editingUser}
        isDark={isDark}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        isLoading={savingUser}
      />

      {/* Modal de Confirmación de Eliminación Renovado */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative z-10 w-full max-w-sm rounded-xl border shadow-xl p-6 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-rose-950/50' : 'bg-rose-50'}`}>
                <AlertIcon />
              </div>
              <h3 className="text-base font-semibold">Confirmar eliminación</h3>
            </div>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ¿Estás seguro de que deseas eliminar a <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteConfirm.name}</span>?
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Esta acción es irreversible y eliminará todos los permisos del usuario.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={updating === deleteConfirm.uid}
                className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={updating === deleteConfirm.uid}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {updating === deleteConfirm.uid ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
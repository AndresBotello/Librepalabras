import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import EditUserModal from '../../components/EditUserModal';
import { getAllUsers, updateUserRole, getUserById, updateUserById } from '../../services/api';

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
        setError('No se pudieron cargar los usuarios');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    try {
      setUpdating(uid);
      await updateUserRole(uid, newRole);
      setUsers(users.map(u =>
        u.uid === uid ? { ...u, role: newRole } : u
      ));
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
      setUsers(users.map(u =>
        u.uid === editingUser.uid ? { ...u, ...updateData } : u
      ));
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

  // Filtrar y paginar usuarios
  const filteredUsers = users.filter(user =>
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
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getRoleColor = (role) => {
    if (role === 'admin') {
      return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
    }
    return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          {/* Header */}
          <div className={`px-6 sm:px-10 py-10 sm:py-14 transition-colors ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 max-w-7xl mx-auto">
              <div className="flex-1">
                <h1 className={`text-4xl font-bold mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Usuarios
                </h1>
                <p className={`text-base transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gestiona todos los usuarios registrados en la plataforma. Total: {filteredUsers.length}
                </p>
              </div>
              <button className="px-6 py-2 rounded-lg font-semibold transition-colors text-sm bg-[#5D4037] text-white hover:bg-[#4A302A] whitespace-nowrap">
                ➕ Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 px-6 sm:px-10 py-10 overflow-y-auto transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">

              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'}`}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className={`mb-6 rounded-lg px-4 py-3 text-sm border ${isDark ? 'border-red-700 bg-red-900 text-red-200' : 'border-red-300 bg-red-100 text-red-800'}`}>
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className={`rounded-lg p-12 text-center transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cargando usuarios...
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className={`rounded-lg p-12 text-center transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No hay usuarios registrados
                  </p>
                </div>
              ) : (
                /* Users Table */
                <div className={`rounded-lg overflow-hidden flex flex-col max-h-[600px] transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full">
                      <thead className={`sticky top-0 transition-colors ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <tr className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Nombre
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Email
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Rol
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Fecha de Registro
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Estado
                          </th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((user) => (
                          <tr key={user.uid} className={isDark ? 'border-b border-gray-800 hover:bg-gray-800' : 'border-b border-gray-200 hover:bg-gray-50'}>
                            <td className={`px-6 py-4 text-sm font-semibold transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                              {user.name}
                            </td>
                            <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {user.email}
                            </td>
                            <td className={`px-6 py-4 text-sm`}>
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                disabled={updating === user.uid}
                                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${getRoleColor(user.role)} ${updating === user.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <option value="collaborator">Colaborador</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className={`px-6 py-4 text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatDate(user.createdAt)}
                            </td>
                            <td className={`px-6 py-4 text-sm`}>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.status === 'Activo'
                                  ? isDark
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-green-100 text-green-800'
                                  : isDark
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 text-gray-700'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-sm space-y-2`}>
                              <button
                                onClick={() => handleEditClick(user.uid)}
                                className={`block w-full px-3 py-2 rounded text-sm font-semibold transition-colors ${isDark ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => handleDeleteClick(user.uid, user.name)}
                                className={`block w-full px-3 py-2 rounded text-sm font-semibold transition-colors ${isDark ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                              >
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between px-6 py-4 border-t transition-colors ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                      <div className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Mostrando {startIndex + 1} a {Math.min(startIndex + usersPerPage, filteredUsers.length)} de {filteredUsers.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                            currentPage === 1
                              ? isDark
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                          }`}
                        >
                          ← Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                              currentPage === page
                                ? 'bg-[#5D4037] text-white'
                                : isDark
                                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                  : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                            currentPage === totalPages
                              ? isDark
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : isDark
                                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                          }`}
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative z-50 w-full max-w-sm rounded-lg shadow-lg transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-bold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                ⚠️ Confirmar eliminación
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className={`transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                ¿Estás seguro de que deseas eliminar a <span className="font-bold">{deleteConfirm.name}</span>?
              </p>
              <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={updating === deleteConfirm.uid}
                  className={`flex-1 px-4 py-2 rounded text-sm font-semibold transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={updating === deleteConfirm.uid}
                  className="flex-1 px-4 py-2 rounded text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === deleteConfirm.uid ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

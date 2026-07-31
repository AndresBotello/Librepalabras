import { listUsers, setUserRole } from '../services/user.service.js';

export async function testAdminAuth(req, res) {
  return res.json({
    ok: true,
    message: 'Autenticación exitosa',
    user: {
      uid: req.auth?.uid,
      email: req.user?.email,
      role: req.user?.role,
      name: req.user?.name,
    },
  });
}

export async function getAdminOverview(_req, res) {
  const users = await listUsers();

  return res.json({
    ok: true,
    message: 'Panel admin disponible',
    data: {
      totalUsers: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      collaborators: users.filter((user) => user.role === 'collaborator').length,
    },
  });
}

export async function getAllUsers(_req, res) {
  try {
    const users = await listUsers();

    const formattedUsers = users.map((user) => {
      const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Usuario';
      return {
        id: user.uid,
        uid: user.uid,
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        name: fullName,
        email: user.email || '',
        role: user.role || 'collaborator',
        telefono: user.telefono || '',
        genero: user.genero || '',
        fechaNacimiento: user.fechaNacimiento || '',
        edad: user.edad || null,
        photoURL: user.photoURL || null,
        createdAt: user.createdAt || new Date().toISOString(),
        lastLoginAt: user.lastLoginAt || null,
        status: user.lastLoginAt ? 'Activo' : 'Inactivo',
      };
    });

    return res.json({
      ok: true,
      message: 'Usuarios obtenidos correctamente',
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener usuarios',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getUserById(req, res) {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        ok: false,
        message: 'uid es obligatorio',
      });
    }

    const { getUserProfile } = await import('../services/user.service.js');
    const user = await getUserProfile(uid);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado',
      });
    }

    return res.json({
      ok: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener usuario',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateUserById(req, res) {
  try {
    const { uid } = req.params;
    const { nombres, apellidos, telefono, genero, role } = req.body;

    if (!uid) {
      return res.status(400).json({
        ok: false,
        message: 'uid es obligatorio',
      });
    }

    const updateData = {};

    if (nombres !== undefined) {
      if (typeof nombres !== 'string' || nombres.trim().length < 2) {
        return res.status(400).json({
          ok: false,
          message: 'Nombres debe tener al menos 2 caracteres',
        });
      }
      updateData.nombres = nombres.trim();
    }

    if (apellidos !== undefined) {
      if (typeof apellidos !== 'string' || apellidos.trim().length < 2) {
        return res.status(400).json({
          ok: false,
          message: 'Apellidos debe tener al menos 2 caracteres',
        });
      }
      updateData.apellidos = apellidos.trim();
    }

    if (telefono !== undefined) {
      const cleanPhone = telefono.replace(/\D/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        return res.status(400).json({
          ok: false,
          message: 'Teléfono debe tener entre 7 y 15 dígitos',
        });
      }
      updateData.telefono = `+57${cleanPhone}`;
    }

    if (genero !== undefined) {
      if (!['masculino', 'femenino', 'otro'].includes(genero)) {
        return res.status(400).json({
          ok: false,
          message: 'Género debe ser: masculino, femenino u otro',
        });
      }
      updateData.genero = genero;
    }

    if (role !== undefined) {
      if (!['admin', 'collaborator'].includes(role)) {
        return res.status(400).json({
          ok: false,
          message: 'Rol debe ser: admin o collaborator',
        });
      }
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'No hay datos para actualizar',
      });
    }

    updateData.updatedAt = new Date().toISOString();

    const { adminDb } = await import('../config/firebaseAdmin.js');
    if (!adminDb) {
      return res.status(503).json({
        ok: false,
        message: 'Base de datos no disponible',
      });
    }

    await adminDb.collection('users').doc(uid).set(updateData, { merge: true });

    const { getUserProfile } = await import('../services/user.service.js');
    const updatedUser = await getUserProfile(uid);

    return res.json({
      ok: true,
      message: 'Usuario actualizado correctamente',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar usuario',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateUserRole(req, res) {
  const { uid } = req.params;
  const { role } = req.body;

  if (!uid) {
    return res.status(400).json({
      ok: false,
      message: 'uid es obligatorio',
    });
  }

  if (!['admin', 'collaborator'].includes(role)) {
    return res.status(400).json({
      ok: false,
      message: 'role debe ser admin o collaborator',
    });
  }

  const updatedUser = await setUserRole(uid, role);

  return res.json({
    ok: true,
    message: 'Rol actualizado correctamente',
    user: updatedUser,
  });
}
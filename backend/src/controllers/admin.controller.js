import { listUsers, setUserRole } from '../services/user.service.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { deleteFile } from '../services/upload.service.js';

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
    const { nombres, apellidos, telefono, genero, role, photoURL, descripcion, fechaNacimiento } = req.body;

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

    if (photoURL !== undefined) {
      updateData.photoURL = photoURL || null;
    }

    if (descripcion !== undefined) {
      updateData.descripcion = descripcion?.trim() || '';
    }

    if (fechaNacimiento !== undefined) {
      updateData.fechaNacimiento = fechaNacimiento || '';
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

export async function getPdfFiles(req, res) {
  try {
    const { search = '', sortBy = 'date', limit = 25, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 25, 100);
    const offsetNum = parseInt(offset) || 0;

    const snapshot = await adminDb.collection('literature').where('pdfUrl', '!=', null).get();

    let files = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const pdfUrl = data.pdfUrl || '';
        const publicId = pdfUrl.split('/').pop()?.replace('.pdf', '') || '';

        return {
          id: doc.id,
          title: data.title || 'Sin título',
          author: data.author || 'Anónimo',
          pdfUrl,
          publicId,
          fileSize: 0,
          uploadedAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'unknown',
          authorId: data.authorId || '',
          totalComments: data.totalComments || 0,
          totalRatings: data.totalRatings || 0,
          views: data.views || 0,
        };
      })
      .filter(file => {
        const searchLower = search.toLowerCase();
        return (
          file.title.toLowerCase().includes(searchLower) ||
          file.author.toLowerCase().includes(searchLower)
        );
      });

    if (sortBy === 'date') {
      files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    } else if (sortBy === 'title') {
      files.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      files.sort((a, b) => a.author.localeCompare(b.author));
    }

    const total = files.length;
    const paginatedFiles = files.slice(offsetNum, offsetNum + limitNum);

    return res.json({
      ok: true,
      files: paginatedFiles,
      total,
      page: Math.floor(offsetNum / limitNum) + 1,
      pageSize: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener archivos PDF',
      error: error.message,
    });
  }
}

export async function deletePdfFile(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: 'ID de documento requerido',
      });
    }

    const docRef = adminDb.collection('literature').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Documento no encontrado',
      });
    }

    const data = doc.data();
    const pdfUrl = data.pdfUrl;

    if (!pdfUrl) {
      return res.status(400).json({
        ok: false,
        message: 'Este documento no tiene PDF asociado',
      });
    }

    // Extraer publicId de la URL o usar la URL directamente
    let publicId = '';
    try {
      const urlParts = pdfUrl.split('/upload/');
      if (urlParts.length > 1) {
        publicId = urlParts[1].replace(/\.\w+$/, '');
      }
    } catch (err) {
      console.error('Error al extraer publicId:', err);
    }

    // Intentar eliminar del almacenamiento si tenemos el publicId
    if (publicId) {
      try {
        await deleteFile(publicId);
      } catch (err) {
        console.error('Error al eliminar de Cloudinary:', err);
        // Continuamos de todas formas
      }
    }

    // Actualizar el documento para remover la URL del PDF
    await docRef.update({
      pdfUrl: null,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      ok: true,
      message: 'PDF eliminado correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al eliminar PDF',
      error: error.message,
    });
  }
}
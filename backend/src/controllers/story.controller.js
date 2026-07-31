import { adminDb } from '../config/firebaseAdmin.js';

export async function createStory(req, res) {
  try {
    if (!adminDb) {
      return res.status(503).json({
        ok: false,
        message: 'Firebase Admin no está configurado todavía.',
      });
    }

    const { title, content, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        ok: false,
        message: 'title y content son obligatorios',
      });
    }

    const docRef = await adminDb.collection('stories').add({
      title,
      content,
      author: author || null,
      createdBy: req.user.uid,
      creatorRole: req.user.role,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      ok: true,
      id: docRef.id,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error guardando la historia',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
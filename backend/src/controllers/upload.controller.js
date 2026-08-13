import {
  uploadImage,
  uploadProfilePhoto as uploadProfilePhotoService,
  uploadPdf,
  uploadMagazinePdf as uploadMagazinePdfService,
} from '../services/upload.service.js';
import { MAX_PDF_BYTES, formatBytes, looksLikePdf, sanitizeFileName } from '../utils/files.js';

export async function uploadCover(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'No se recibió archivo' });
  }

  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ ok: false, message: 'El archivo debe ser una imagen' });
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ ok: false, message: 'La imagen no puede pesar más de 5MB' });
  }

  try {
    const result = await uploadImage(req.file, 'covers');
    // `publicId` permite borrar la imagen anterior al reemplazarla.
    return res.json({ ok: true, url: result.url, publicId: result.publicId });
  } catch (error) {
    console.error('Error uploadCover:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
}

export async function uploadProfilePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'No se recibió archivo' });
  }

  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ ok: false, message: 'El archivo debe ser una imagen' });
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ ok: false, message: 'La imagen no puede pesar más de 5MB' });
  }

  try {
    const result = await uploadProfilePhotoService(req.file);
    return res.json({ ok: true, url: result.url });
  } catch (error) {
    console.error('Error uploadProfilePhoto:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
}

export async function uploadMagazinePdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'No se recibió archivo' });
  }

  // Triple comprobación: mimetype declarado, extensión y firma real del archivo.
  // Las dos primeras las controla el cliente; la tercera no se puede falsear.
  const hasPdfExtension = /\.pdf$/i.test(req.file.originalname || '');

  if (req.file.mimetype !== 'application/pdf' || !hasPdfExtension || !looksLikePdf(req.file.buffer)) {
    return res.status(400).json({ ok: false, message: 'El archivo debe ser un PDF válido' });
  }

  if (req.file.size > MAX_PDF_BYTES) {
    return res.status(400).json({
      ok: false,
      message: `El PDF no puede pesar más de ${formatBytes(MAX_PDF_BYTES)}`,
    });
  }

  try {
    const publicId = sanitizeFileName(req.file.originalname);
    const result = await uploadMagazinePdfService(req.file, publicId);

    return res.json({
      ok: true,
      url: result.url,
      publicId: result.publicId,
      size: result.bytes ?? req.file.size,
      pages: result.pages,
      fileName: `${publicId}.pdf`,
    });
  } catch (error) {
    console.error('Error uploadMagazinePdf:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
}

export async function uploadLiteraryPdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'No se recibió archivo' });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ ok: false, message: 'El archivo debe ser un PDF' });
  }

  if (req.file.size > MAX_PDF_BYTES) {
    return res.status(400).json({
      ok: false,
      message: `El PDF no puede pesar más de ${formatBytes(MAX_PDF_BYTES)}`,
    });
  }

  try {
    const result = await uploadPdf(req.file, 'pdfs');

    // Asegurar que la URL tenga la extensión .pdf
    let pdfUrl = result.url;
    if (!pdfUrl.endsWith('.pdf')) {
      pdfUrl += '.pdf';
    }

    return res.json({
      ok: true,
      url: pdfUrl,
      publicId: result.publicId
    });
  } catch (error) {
    console.error('Error uploadPdf:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
}


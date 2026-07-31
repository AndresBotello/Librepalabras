import { uploadImage, uploadPdf } from '../services/upload.service.js';

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
    return res.json({ ok: true, url: result.url });
  } catch (error) {
    console.error('Error uploadCover:', error);
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

  if (req.file.size > 50 * 1024 * 1024) {
    return res.status(400).json({ ok: false, message: 'El PDF no puede pesar más de 50MB' });
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


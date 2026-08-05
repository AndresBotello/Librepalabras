import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file, folder = 'covers') {
  try {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `librepalaras/${folder}`,
          resource_type: 'auto',
          eager: [
            {
              width: 500,
              height: 750,
              crop: 'fill',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
        }
      );

      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

export async function uploadProfilePhoto(file) {
  try {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'librepalaras/profile-photos',
          resource_type: 'auto',
          transformation: [
            {
              width: 300,
              height: 300,
              crop: 'fill',
              gravity: 'face',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
        }
      );

      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Error al subir foto de perfil: ${error.message}`);
  }
}

export async function uploadPdf(file, folder = 'pdfs') {
  try {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `librepalaras/${folder}`,
          resource_type: 'auto',
          type: 'upload',
          flags: 'attachment',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('PDF uploaded successfully:', result.secure_url);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Error al subir PDF: ${error.message}`);
  }
}

/**
 * PDF de una edición de revista. Igual que uploadPdf usa `resource_type: 'auto'`,
 * pero sin `flags: 'attachment'`: la revista se lee embebida en el visor, no se
 * fuerza la descarga. El public_id sale del nombre ya saneado.
 */
export async function uploadMagazinePdf(file, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'librepalaras/poliversia',
        resource_type: 'auto',
        type: 'upload',
        public_id: publicId,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Error al subir PDF: ${error.message}`));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          pages: result.pages || null,
        });
      }
    );

    stream.end(file.buffer);
  });
}

export async function deleteFile(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}

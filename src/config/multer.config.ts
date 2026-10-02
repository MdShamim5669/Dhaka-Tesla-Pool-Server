import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinaryUpload } from './cloudinary.config.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (_req, file) => {
    const originalName = file.originalname;
    const extension = originalName.split('.').pop()?.toLowerCase();

    const fileNameWithoutExtension = originalName
      .split('.')
      .slice(0, -1)
      .join('.')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    const uniqueName =
      Math.random().toString(36).substring(2) +
      '-' +
      Date.now() +
      '-' +
      fileNameWithoutExtension;

    // Categorize documents (driver license, fitness certificate) vs images (Tesla photo, driver avatar)
    const folder = extension === 'pdf' ? 'documents' : 'images';

    return {
      folder: `dhaka-tesla-pool/${folder}`,
      public_id: uniqueName,
      resource_type: 'auto',
    };
  },
});

export const multerUpload = multer({ storage });
export default multerUpload;

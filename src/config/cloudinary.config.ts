import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const cloudinaryUpload = cloudinary;

export const deleteFileFromCloudinary = async (fileUrlOrPublicId: string): Promise<any> => {
  try {
    if (!fileUrlOrPublicId) return;

    // If it's a full URL, parse the public_id
    let publicId = fileUrlOrPublicId;
    if (fileUrlOrPublicId.includes('res.cloudinary.com')) {
      const parts = fileUrlOrPublicId.split('/');
      const filename = parts.pop() || '';
      const publicIdPart = filename.split('.')[0];
      const folderIndex = parts.indexOf('dhaka-tesla-pool');
      if (folderIndex !== -1) {
        publicId = `${parts.slice(folderIndex).join('/')}/${publicIdPart}`;
      } else {
        publicId = publicIdPart;
      }
    }

    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
  }
};

export default cloudinaryUpload;

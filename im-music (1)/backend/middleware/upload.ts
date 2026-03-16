import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'im-music-tracks',
    resource_type: 'auto', // Important for audio files
    allowed_formats: ['jpg', 'png', 'mp3', 'wav', 'ogg'],
  } as any,
});

export const upload = multer({ storage: storage });

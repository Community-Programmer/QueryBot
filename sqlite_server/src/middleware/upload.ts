import multer from 'multer';
import path from 'path';
import { ensureUploadsDir } from '../utils/fileUtils';

// Ensure uploads directory exists
ensureUploadsDir();

// Configure multer for file uploads
export const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.sqlite', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .sqlite and .csv files are allowed.'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB file size limit
  },
});
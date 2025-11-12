import express from 'express';
import { SqliteController } from '../controllers/SqliteController';
import { upload } from '../middleware/upload';

const router = express.Router();
const sqliteController = new SqliteController();

// File upload endpoint
router.post('/upload-file', upload.single('file'), sqliteController.uploadFile);

// Query execution endpoint
router.post('/execute-query', sqliteController.executeQuery);

// Schema retrieval endpoint
router.get('/get-schema/:uuid', sqliteController.getSchema);

export default router;
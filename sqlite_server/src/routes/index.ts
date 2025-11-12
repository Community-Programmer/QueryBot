import express from 'express';
import sqliteRoutes from './sqlite';

const router = express.Router();

// Mount SQLite routes
router.use('/', sqliteRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'QueryBot SQLite Server API',
    version: '1.0.0',
    endpoints: {
      'POST /upload-file': 'Upload SQLite or CSV file',
      'POST /execute-query': 'Execute SQL query on uploaded database',
      'GET /get-schema/:uuid': 'Get database schema information',
    },
  });
});

export default router;
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import apiRoutes from './routes';
import { deleteOldFiles } from './utils/fileUtils';

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Set up interval to run deleteOldFiles every hour
setInterval(deleteOldFiles, 3600000);

// API routes
app.use('/', apiRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'QueryBot SQLite Server',
    version: '1.0.0',
    endpoints: {
      'POST /upload-file': 'Upload SQLite or CSV file',
      'POST /execute-query': 'Execute SQL query on uploaded database', 
      'GET /get-schema/:uuid': 'Get database schema information',
    },
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
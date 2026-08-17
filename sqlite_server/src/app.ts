import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import { requestLogger } from './middleware/requestLogger';
import apiRoutes from './routes';

const app: Express = express();

// Behind a reverse proxy, trust the forwarded headers so client IPs log correctly.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token'],
  })
);

// Minimal hardening without pulling in a dependency: these responses are JSON
// and file downloads, never rendered HTML.
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Must precede the logger so every log line carries the correlation id.
app.use(requestContext);
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness, as distinct from liveness: this reports whether the service can
 * actually do its job, which here means the uploads directory is writable.
 */
app.get('/ready', (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    fs.accessSync(config.uploadDir, fs.constants.W_OK);
    checks.storage = 'ok';
  } catch {
    checks.storage = 'unwritable';
  }

  const ready = checks.storage === 'ok';
  res.status(ready ? 200 : 503).json({ ready, checks, timestamp: new Date().toISOString() });
});

app.use('/', apiRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
    timestamp: new Date().toISOString(),
  });
});

// Must be registered last so it catches everything above it.
app.use(errorHandler);

export default app;

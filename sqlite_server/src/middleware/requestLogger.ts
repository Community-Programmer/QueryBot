import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('User-Agent') || '';

  // Log the incoming request
  console.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);

  // Capture the original res.end to log response time
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log the response
    console.log(`${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
    
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
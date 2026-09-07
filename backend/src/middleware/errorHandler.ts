import { Request, Response, NextFunction } from 'express';
import { run } from '../config/database.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled API Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Log error to activity log table asynchronously
  try {
    run(
      'INSERT INTO activity_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [
        `ERR-${Date.now()}`,
        (req as any).user?.id || 'ANONYMOUS',
        'SYSTEM_ERROR',
        `Error on ${req.method} ${req.originalUrl}: ${message}`,
        req.ip || '127.0.0.1',
      ]
    ).catch(() => {});
  } catch (_) {}

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    // Never leak stack trace to clients in production or development API responses
    timestamp: new Date().toISOString(),
  });
};


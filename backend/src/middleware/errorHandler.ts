import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import {
  CORS_NOT_ALLOWED,
  INTERNAL_ERROR,
  INVALID_RESOURCE_ID,
  VALIDATION_FAILED,
} from '../constants/errors';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  name: string;
  keyValue?: Record<string, any>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error('Unhandled error caught in errorHandler:', err);

  if (err.message === CORS_NOT_ALLOWED) {
    res.status(403).json({
      error: CORS_NOT_ALLOWED,
      message: CORS_NOT_ALLOWED,
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((e) => e.message).join(', ') || VALIDATION_FAILED;
    res.status(400).json({
      error: message,
      message,
      details: err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    res.status(409).json({
      error: message,
      message,
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      error: INVALID_RESOURCE_ID,
      message: INVALID_RESOURCE_ID,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const exposeMessage = statusCode < 500 || env.NODE_ENV === 'development';
  const message = exposeMessage ? err.message || INTERNAL_ERROR : INTERNAL_ERROR;

  res.status(statusCode).json({
    error: message,
    message,
  });
};

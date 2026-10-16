import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AUTH_COOKIE_NAME } from '../constants/auth';
import { AUTH_REQUIRED, INVALID_TOKEN } from '../constants/errors';

export interface AuthUser {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: AUTH_REQUIRED });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: INVALID_TOKEN });
  }
};

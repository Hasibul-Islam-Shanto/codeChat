import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { signupSchema, signinSchema } from '../validators/auth.validators';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  BCRYPT_SALT_ROUNDS,
  JWT_EXPIRES_IN,
} from '../constants/auth';
import { EMAIL_ALREADY_REGISTERED, INVALID_CREDENTIALS, LOGGED_OUT, NOT_AUTHENTICATED } from '../constants/errors';

const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
  });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = signupSchema.parse(req.body);

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409).json({ error: EMAIL_ALREADY_REGISTERED, message: EMAIL_ALREADY_REGISTERED });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const newUser = await User.create({
    username,
    email: normalizedEmail,
    passwordHash,
  });

  const token = jwt.sign({ userId: newUser._id.toString() }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  setAuthCookie(res, token);

  res.status(201).json({
    user: {
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
    },
  });
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = signinSchema.parse(req.body);

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401).json({ error: INVALID_CREDENTIALS, message: INVALID_CREDENTIALS });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: INVALID_CREDENTIALS, message: INVALID_CREDENTIALS });
    return;
  }

  const token = jwt.sign({ userId: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  setAuthCookie(res, token);

  res.status(200).json({
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({ status: 'ok', message: LOGGED_OUT });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: NOT_AUTHENTICATED, message: NOT_AUTHENTICATED });
    return;
  }

  const user = await User.findById(req.user.userId).select('-passwordHash');
  if (!user) {
    res.status(404).json({ error: 'User not found', message: 'User not found' });
    return;
  }

  res.status(200).json({
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
  });
};

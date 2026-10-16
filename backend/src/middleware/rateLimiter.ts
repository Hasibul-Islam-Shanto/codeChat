import rateLimit from 'express-rate-limit';
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
  SEND_RATE_LIMIT_MAX,
  SEND_RATE_LIMIT_WINDOW_MS,
} from '../constants/auth';
import { RATE_LIMIT_MESSAGE } from '../constants/errors';

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: RATE_LIMIT_MESSAGE,
  },
});

export const sendRateLimiter = rateLimit({
  windowMs: SEND_RATE_LIMIT_WINDOW_MS,
  max: SEND_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: RATE_LIMIT_MESSAGE,
  },
});

import { Router } from 'express';
import { signup, signin, logout, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/signup', authRateLimiter, asyncHandler(signup));
router.post('/signin', authRateLimiter, asyncHandler(signin));
router.post('/logout', asyncHandler(logout));
router.get('/me', authMiddleware, asyncHandler(getMe));

export default router;

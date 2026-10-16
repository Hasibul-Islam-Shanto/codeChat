import { Router } from 'express';
import {
  createChat,
  listChats,
  getChat,
  updateChat,
  deleteChat,
  getMessages,
  createMessage,
} from '../controllers/chatController';
import { sendMessage } from '../controllers/sendController';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.post('/', asyncHandler(createChat));
router.get('/', asyncHandler(listChats));
router.get('/:id', asyncHandler(getChat));
router.patch('/:id', asyncHandler(updateChat));
router.delete('/:id', asyncHandler(deleteChat));

router.get('/:id/messages', asyncHandler(getMessages));
router.post('/:id/messages', asyncHandler(createMessage));
router.post('/:id/send', sendRateLimiter, asyncHandler(sendMessage));

export default router;

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { HEALTHY, UNHEALTHY } from '../constants/errors';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    res.status(503).json({ status: UNHEALTHY, db: 'disconnected' });
    return;
  }

  res.status(200).json({ status: HEALTHY, db: 'connected' });
});

export default router;

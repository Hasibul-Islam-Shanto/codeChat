import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import { errorHandler } from './middleware/errorHandler';
import { CORS_NOT_ALLOWED } from './constants/errors';

const app = express();

if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalDevOrigin =
        env.NODE_ENV === 'development' &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));

      if (origin === env.CORS_ORIGIN || isLocalDevOrigin) {
        return callback(null, true);
      }

      return callback(new Error(CORS_NOT_ALLOWED));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;

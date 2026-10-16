import mongoose from 'mongoose';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Chatbot backend server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`👉 Health check: http://localhost:${env.PORT}/api/health`);
    });

    const gracefulShutdown = () => {
      console.log('\nReceived kill signal, shutting down gracefully...');
      const forceTimer = setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 5000);
      forceTimer.unref();

      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log('Closed out remaining connections');
          process.exit(0);
        } catch (error) {
          console.error('Error while disconnecting from MongoDB:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

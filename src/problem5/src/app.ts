import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.js';
import { errorHandler, notFound } from './errors.js';

export function buildApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '64kb' }));

  if ((process.env.LOG_REQUESTS ?? 'true').toLowerCase() === 'true') {
    app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/tasks', tasksRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

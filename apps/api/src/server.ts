import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { authLimiter, aiLimiter, codeExecutionLimiter, generalLimiter } from './middlewares/rateLimiters';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import topicsRoutes from './modules/topics/topics.routes';
import cors from 'cors';
import activitiesRoutes from './modules/activities/activities.routes';
import analysisRoutes from './modules/analysis/analysis.routes';
import aiRoutes from './modules/ai/ai.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import interviewRoutes from './modules/interview/interview.routes';
import recommendationsRoutes from './modules/recommendations/recommendations.routes';

export function createApp(): Express {
  const app = express();

    app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/topics', topicsRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/interview', aiLimiter, interviewRoutes);
  app.use('/api/ai', aiLimiter, aiRoutes);
  app.use('/api/recommendations', recommendationsRoutes);

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/configuration.js';
import { authRouter } from './auth/auth.module.js';
import { usersRouter } from './users/users.controller.js';
import { productsRouter } from './products/products.module.js';
import { rentalsRouter } from './rentals/rentals.module.js';
import { paymentsRouter } from './payments/payments.module.js';
import { reportsRouter } from './reports/reports.module.js';
import { prisma } from './db/postgres.js';
import path from 'path';

export async function createApp() {
  const app = express();
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  
  // Serve static files for PDF generation
  app.use('/static', express.static(path.join(process.cwd(), 'public')));

  const limiter = rateLimit({ windowMs: 60_000, max: 60 });
  app.use('/auth', limiter);

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, database: 'connected' });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/products', productsRouter);
  app.use('/rentals', rentalsRouter);
  app.use('/payments', paymentsRouter);
  app.use('/reports', reportsRouter);

  return app;
}


import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { memberRouter } from './routes/memberRoutes.js';
import { departmentRouter } from './routes/departmentRoutes.js';
import { sessionRouter } from './routes/sessionRoutes.js';
import { attendanceRouter } from './routes/attendanceRoutes.js';
import { financeRouter } from './routes/financeRoutes.js';
import { messageRouter } from './routes/messageRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';
import { celebrationRouter } from './routes/celebrationRoutes.js';
import { campaignRouter } from './routes/campaignRoutes.js';

dotenv.config();

const app = express();

// Allow requests from any origin (Vercel frontend + local dev)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    system: 'CACI Church Management System',
    db: process.env.DATABASE_URL ? 'TiDB Cloud connected' : 'No DB URL',
  });
});

// Mount Routes
app.use('/api/members', memberRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/finances', financeRouter);
app.use('/api/messages', messageRouter);
app.use('/api/sync', syncRouter);
app.use('/api/celebrations', celebrationRouter);
app.use('/api/campaigns', campaignRouter);

export default app;

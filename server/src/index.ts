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
import { dispatchCelebrationBlessings } from './services/celebrationService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), system: 'CACI Church Management System' });
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

// Automated Daily Celebration Dispatcher (Runs every morning)
const AUTO_DISPATCH_HOUR = 7; // 7:00 AM
let lastAutoRunDay = -1;

setInterval(async () => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentHour = now.getHours();

  if (currentHour >= AUTO_DISPATCH_HOUR && lastAutoRunDay !== currentDay) {
    lastAutoRunDay = currentDay;
    console.log(`[Celebration Engine] Running daily automated Birthday & Anniversary check for ${now.toDateString()}...`);
    try {
      const res = await dispatchCelebrationBlessings({});
      console.log(`[Celebration Engine] Dispatched blessings to ${res.dispatchedCount} celebrants.`);
    } catch (err: any) {
      console.error('[Celebration Engine] Error in automated celebration dispatch:', err.message);
    }
  }
}, 60 * 1000); // Check every minute

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  CACI Church Management Backend Running!   `);
  console.log(`  Port: http://localhost:${PORT}             `);
  console.log(`  Database: MySQL (caci_church_db)           `);
  console.log(`=============================================`);
});

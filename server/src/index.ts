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

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  CACI Church Management Backend Running!   `);
  console.log(`  Port: http://localhost:${PORT}             `);
  console.log(`  Database: MySQL (caci_church_db)           `);
  console.log(`=============================================`);
});

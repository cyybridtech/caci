import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const sessionRouter = Router();

// GET /api/sessions/active - get latest or today's active session
sessionRouter.get('/active', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let session = await prisma.serviceSession.findFirst({
      where: {
        serviceDate: {
          gte: today
        }
      },
      orderBy: { serviceDate: 'desc' }
    });

    if (!session) {
      session = await prisma.serviceSession.findFirst({
        orderBy: { serviceDate: 'desc' }
      });
    }

    if (!session) {
      session = await prisma.serviceSession.create({
        data: {
          serviceDate: new Date(),
          serviceType: 'Sunday Divine Service',
          theme: 'Walking in Supernatural Victory',
          notes: 'Auto-created service session'
        }
      });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// GET /api/sessions/by-date - find or create session for a specific selected date
sessionRouter.get('/by-date', async (req: Request, res: Response) => {
  try {
    const { date, createIfNotFound, serviceType } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    const targetStart = new Date(date);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(date);
    targetEnd.setHours(23, 59, 59, 999);

    let session = await prisma.serviceSession.findFirst({
      where: {
        serviceDate: {
          gte: targetStart,
          lte: targetEnd
        }
      },
      include: {
        _count: {
          select: { attendance: true, contributions: true }
        }
      }
    });

    if (!session && createIfNotFound === 'true') {
      session = await prisma.serviceSession.create({
        data: {
          serviceDate: new Date(date),
          serviceType: (serviceType as string) || 'Sunday Divine Service',
          theme: 'Walking with God',
          notes: `Created for date ${date}`
        },
        include: {
          _count: {
            select: { attendance: true, contributions: true }
          }
        }
      });
    }

    res.json(session || null);
  } catch (error: any) {
    console.error('Error fetching session by date:', error);
    res.status(500).json({ error: 'Failed to fetch session by date' });
  }
});

// GET /api/sessions - list all sessions
sessionRouter.get('/', async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.serviceSession.findMany({
      include: {
        _count: {
          select: {
            attendance: true,
            contributions: true
          }
        }
      },
      orderBy: { serviceDate: 'desc' },
      take: 60
    });

    res.json(sessions);
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/sessions - create new session with custom chosen date
sessionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { serviceDate, serviceType, theme, notes } = req.body;

    if (!serviceType) {
      return res.status(400).json({ error: 'Service type is required' });
    }

    const session = await prisma.serviceSession.create({
      data: {
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        serviceType,
        theme: theme || null,
        notes: notes || null
      }
    });

    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error creating service session:', error);
    res.status(500).json({ error: 'Failed to create service session' });
  }
});

import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const departmentRouter = Router();

// Simple in-memory cache — departments rarely change
let deptCache: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateDeptCache() {
  deptCache = null;
}

// GET /api/departments
departmentRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Serve from cache if fresh
    if (deptCache && Date.now() < deptCache.expiresAt) {
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('X-Cache', 'HIT');
      return res.json(deptCache.data);
    }

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { members: true }
        },
        members: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                churchGroup: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Store in cache
    deptCache = { data: departments, expiresAt: Date.now() + CACHE_TTL_MS };
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Cache', 'MISS');
    res.json(departments);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/departments
departmentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, leaderName } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const created = await prisma.department.create({
      data: {
        name,
        description: description || null,
        leaderName: leaderName || null
      }
    });

    invalidateDeptCache(); // Clear cache on write
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

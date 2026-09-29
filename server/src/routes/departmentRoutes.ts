import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const departmentRouter = Router();

departmentRouter.use(requireAuth);

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

// POST /api/departments/:id/members - Assign member to department
departmentRouter.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const departmentId = req.params.id as string;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Upsert join record
    await prisma.memberDepartment.upsert({
      where: {
        memberId_departmentId: {
          memberId,
          departmentId
        }
      },
      update: {},
      create: {
        memberId,
        departmentId
      }
    });

    invalidateDeptCache();

    // Return updated department
    const updated = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: { select: { members: true } },
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
      }
    });

    res.status(201).json(updated);
  } catch (error: any) {
    console.error('Error assigning member to department:', error);
    res.status(500).json({ error: 'Failed to assign member to department' });
  }
});

// DELETE /api/departments/:id/members/:memberId - Remove member from department
departmentRouter.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const departmentId = req.params.id as string;
    const memberId = req.params.memberId as string;

    await prisma.memberDepartment.deleteMany({
      where: {
        departmentId,
        memberId
      }
    });

    invalidateDeptCache();

    res.json({ success: true, message: 'Member removed from department' });
  } catch (error: any) {
    console.error('Error removing member from department:', error);
    res.status(500).json({ error: 'Failed to remove member from department' });
  }
});

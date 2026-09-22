import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

export const departmentRouter = Router();

// GET /api/departments
departmentRouter.get('/', async (req: Request, res: Response) => {
  try {
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

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

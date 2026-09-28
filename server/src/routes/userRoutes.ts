import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ChurchGroup, UserRole } from '@prisma/client';

export const userRouter = Router();

userRouter.use(requireAuth);

// GET /api/users - Admin gets all users, Cell leader gets users in their cell
userRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { role, cell } = req.user!;
    const whereClause: any = {};

    if (role === 'CELL_LEADER') {
      if (!cell) {
        return res.json([]);
      }
      whereClause.cell = cell as ChurchGroup;
    } else if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin or Cell Leader role required' });
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        role: true,
        cell: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Admin or Cell Leader creates user
userRouter.post('/', async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const { username, role, cell } = req.body;

    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role are required' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const validRoles: UserRole[] = [UserRole.ADMIN, UserRole.CELL_LEADER, UserRole.MEDIA_TEAM, UserRole.FINANCE];
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Permission check
    let assignedCell = cell ? (cell as ChurchGroup) : null;
    if (currentUser.role === UserRole.CELL_LEADER) {
      // Cell leaders can only create users within their own cell
      if (role !== UserRole.CELL_LEADER) {
        return res.status(403).json({ error: 'Cell leaders can only manage cell leader accounts for their cell' });
      }
      assignedCell = currentUser.cell as ChurchGroup;
    } else if (currentUser.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (role === UserRole.CELL_LEADER && !assignedCell) {
      return res.status(400).json({ error: 'Cell assignment is required for Cell Leaders' });
    }

    // Default password is the username itself
    const hashedPassword = await bcrypt.hash(trimmedUsername, 12);

    const newUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
        role: role as UserRole,
        cell: assignedCell,
        mustChangePassword: true,
        createdById: currentUser.userId,
      },
      select: {
        id: true,
        username: true,
        role: true,
        cell: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A user with this username already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', message: error.message });
  }
});

// DELETE /api/users/:id - Admin or Cell Leader deletes user
userRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUser = req.user!;

    if (id === currentUser.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role === UserRole.CELL_LEADER) {
      if (targetUser.cell !== currentUser.cell) {
        return res.status(403).json({ error: 'You can only delete users in your cell' });
      }
    } else if (currentUser.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH /api/users/:id/reset-password - Resets password to username
userRouter.patch('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUser = req.user!;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role === UserRole.CELL_LEADER) {
      if (targetUser.cell !== currentUser.cell) {
        return res.status(403).json({ error: 'You can only reset passwords for users in your cell' });
      }
    } else if (currentUser.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const hashedPassword = await bcrypt.hash(targetUser.username, 12);
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    res.json({ success: true, message: `Password for ${targetUser.username} has been reset to their username` });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

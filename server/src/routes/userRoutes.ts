import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ChurchGroup, UserRole } from '@prisma/client';

export const userRouter = Router();

userRouter.use(requireAuth);

// GET /api/users - Only Admin gets all users
userRouter.get('/', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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

// POST /api/users - Admin creates user
userRouter.post('/', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
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

    const assignedCell = cell ? (cell as ChurchGroup) : null;
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

// DELETE /api/users/:id - Admin deletes user
userRouter.delete('/:id', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
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

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH /api/users/:id/reset-password - Resets password to username
userRouter.patch('/:id/reset-password', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
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

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'ADMIN' | 'CELL_LEADER' | 'MEDIA_TEAM' | 'FINANCE';
export type CellGroup = 'JOY' | 'FAITH' | 'HOPE' | 'LOVE';

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
  cell?: CellGroup;
}

// Extend Express Request to include auth user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

/**
 * requireAuth — validates JWT and attaches decoded user to req.user
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * requireRole — restricts route to specific roles (used after requireAuth)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};

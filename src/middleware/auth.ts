import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

type PlanTier = 'free' | 'basic' | 'indie' | 'pro';
const PLAN_ORDER: Record<PlanTier, number> = { free: 0, basic: 1, indie: 2, pro: 3 };

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string; plan?: PlanTier };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

export const requirePlan = (minPlan: PlanTier) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    try {
      const sub = await db.prepare(
        `SELECT plan_id FROM subscriptions WHERE user_email = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`
      ).get(req.user.email) as { plan_id: string } | undefined;

      const userPlan = (sub?.plan_id || 'free') as PlanTier;
      req.user.plan = userPlan;

      if ((PLAN_ORDER[userPlan] ?? 0) >= PLAN_ORDER[minPlan]) return next();

      res.status(403).json({
        error: `Necesitas el plan ${minPlan} o superior para acceder a esta función`,
        requiredPlan: minPlan,
        currentPlan: userPlan,
        upgradeUrl: '/settings'
      });
    } catch {
      // If subscription check fails, let through (fail open for non-blocking UX)
      next();
    }
  };
};
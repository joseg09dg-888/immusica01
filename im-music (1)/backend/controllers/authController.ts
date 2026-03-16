import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { createUser, findUserByEmail } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    
    const existing = findUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = createUser(email, hashedPassword, name);
    res.status(201).json({ id: result.lastInsertRowid });
  }
];

export const login = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const user = findUserByEmail(email);
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    try {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      console.error('Bcrypt compare error:', error);
      // Fallback for non-hashed passwords if any exist (not recommended for production but helps during migration)
      if (password !== user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  }
];

export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = findUserByEmail(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
};

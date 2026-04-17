import { Router } from 'express';
import { login, callback, loginEmail, register } from '../controllers/authController';
import { validate, schemas } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import db from '../database';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/spotify', login);
router.get('/callback', callback);
router.post('/login', validate(schemas.login), loginEmail);
router.post('/register', validate(schemas.register), register);

// GET /api/auth/profile — return current user data
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const user = await db.prepare(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?'
    ).get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT /api/auth/profile — update name / password
router.put('/profile', authenticate, validate(schemas.updateProfile), async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { name, password, currentPassword } = req.body;
    if (password) {
      const user = await db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id) as any;
      const ok = await bcrypt.compare(currentPassword || '', user?.password || '');
      if (!ok) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      const hashed = await bcrypt.hash(password, 10);
      await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    }
    if (name) await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
    const updated = await db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Perfil actualizado', user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

export default router;

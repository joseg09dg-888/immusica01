import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  assignArtistToUser,
  removeArtistFromUser,
  getMyArtists,
  getArtistUsers,
  createTeam,
  addTeamMember
} from '../controllers/teamController';

const router = express.Router();

import { AuthRequest } from '../middleware/auth';
import db from '../database';

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/team — return current user's team info
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const members = await db.prepare(`
      SELECT u.id, u.name, u.email, ua.role
      FROM user_artists ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.artist_id IN (
        SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
      )
    `).all(req.user.id) as any[];
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener equipo' });
  }
});

// ========== GESTIÓN DE ACCESO A ARTISTAS ==========
// Asignar artista a otro usuario (manager)
router.post('/assign', assignArtistToUser);

// Listar mis artistas (con roles)
router.get('/my-artists', getMyArtists);

// Listar usuarios con acceso a un artista
router.get('/artist/:artistId/users', getArtistUsers);

// Quitar acceso de un usuario a un artista
router.delete('/artist/:artistId/user/:userId', removeArtistFromUser);

// ========== GESTIÓN DE EQUIPOS (SELLOS) ==========
router.post('/teams', createTeam);
router.post('/teams/:teamId/members', addTeamMember);

export default router;
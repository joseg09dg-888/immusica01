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

// Todas las rutas requieren autenticación
router.use(authenticate);

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
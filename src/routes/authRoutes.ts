import { Router } from 'express';
import { login, callback, loginEmail } from '../controllers/authController';

const router = Router();

// Rutas de autenticación
router.get('/login', login);
router.get('/callback', callback);
router.post('/login-email', loginEmail); // Nuevo endpoint para login con email

export default router;
import { Router } from 'express';
import { login, callback, loginEmail, register } from '../controllers/authController';

const router = Router();

router.get('/spotify', login);
router.get('/callback', callback);
router.post('/login', loginEmail);
router.post('/register', register);

export default router;

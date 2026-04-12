import { Router } from 'express';
import { login, callback, loginEmail, register } from '../controllers/authController';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.get('/spotify', login);
router.get('/callback', callback);
router.post('/login', validate(schemas.login), loginEmail);
router.post('/register', validate(schemas.register), register);

export default router;

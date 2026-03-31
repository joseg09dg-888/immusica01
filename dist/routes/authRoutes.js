"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Rutas de autenticación
router.get('/login', authController_1.login);
router.get('/callback', authController_1.callback);
router.post('/login-email', authController_1.loginEmail); // Nuevo endpoint para login con email
exports.default = router;

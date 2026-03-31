"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const teamController_1 = require("../controllers/teamController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// ========== GESTIÓN DE ACCESO A ARTISTAS ==========
// Asignar artista a otro usuario (manager)
router.post('/assign', teamController_1.assignArtistToUser);
// Listar mis artistas (con roles)
router.get('/my-artists', teamController_1.getMyArtists);
// Listar usuarios con acceso a un artista
router.get('/artist/:artistId/users', teamController_1.getArtistUsers);
// Quitar acceso de un usuario a un artista
router.delete('/artist/:artistId/user/:userId', teamController_1.removeArtistFromUser);
// ========== GESTIÓN DE EQUIPOS (SELLOS) ==========
router.post('/teams', teamController_1.createTeam);
router.post('/teams/:teamId/members', teamController_1.addTeamMember);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const playlistController_1 = require("../controllers/playlistController");
const router = express_1.default.Router();
// Rutas públicas
router.get('/', playlistController_1.getPlaylists);
router.get('/moods', playlistController_1.getMoods);
router.get('/:id', playlistController_1.getPlaylistById);
// Rutas protegidas
router.post('/', auth_1.authenticate, playlistController_1.createPlaylist);
router.put('/:id', auth_1.authenticate, playlistController_1.updatePlaylist);
router.delete('/:id', auth_1.authenticate, playlistController_1.deletePlaylist);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const spotifyVerificationController_1 = require("../controllers/spotifyVerificationController");
const router = express_1.default.Router();
// Ruta pública para el callback de Spotify
router.get('/callback', spotifyVerificationController_1.verificationCallback);
// Rutas protegidas
router.use(auth_1.authenticate);
router.get('/status', spotifyVerificationController_1.getVerificationStatus);
router.get('/start', spotifyVerificationController_1.startVerification);
exports.default = router;

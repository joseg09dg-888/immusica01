"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const landingController_1 = require("../controllers/landingController");
const router = express_1.default.Router();
// Rutas públicas
router.get('/:slug', landingController_1.getLandingPage);
router.post('/:slug/lead', landingController_1.captureLead);
// Rutas protegidas (requieren autenticación)
router.use(auth_1.authenticate);
router.post('/', landingController_1.createLandingPage);
router.get('/my/list', landingController_1.getMyLandingPages);
router.delete('/:id', landingController_1.deleteLandingPage);
exports.default = router;

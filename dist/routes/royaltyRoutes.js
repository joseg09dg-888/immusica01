"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const royaltyController_1 = require("../controllers/royaltyController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
router.get('/summary', royaltyController_1.getSummary);
router.post('/upload', royaltyController_1.uploadRoyalties);
router.get('/', (0, auth_1.authorize)('admin'), royaltyController_1.getAllRoyalties);
// Rutas para retenciones
router.get('/withholdings/track/:trackId', royaltyController_1.getWithholdingsByTrack);
router.get('/withholdings/my', royaltyController_1.getMyWithholdings);
router.put('/withholdings/:withholdingId/release', royaltyController_1.releaseWithholding);
exports.default = router;

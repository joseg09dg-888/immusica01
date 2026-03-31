"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const vaultController_1 = require("../controllers/vaultController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Subir archivo al vault
router.post('/upload', vaultController_1.uploadToVault);
// Listar archivos
router.get('/', vaultController_1.listVaultFiles);
// Obtener metadatos de un archivo
router.get('/:id', vaultController_1.getVaultFile);
// Descargar archivo
router.get('/:id/download', vaultController_1.downloadVaultFile);
// Eliminar archivo
router.delete('/:id', vaultController_1.deleteVaultFile);
exports.default = router;

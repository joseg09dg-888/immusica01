"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const chatController_1 = require("../controllers/chatController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
router.post('/send', chatController_1.sendMessage);
router.get('/recent', chatController_1.getRecentMessages);
router.post('/report/:messageId', chatController_1.reportMessage);
exports.default = router;

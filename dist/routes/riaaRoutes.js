"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const riaaController_1 = require("../controllers/riaaController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/status', riaaController_1.getCertificationStatus);
router.get('/history/:artistId', riaaController_1.getCertificationHistory);
exports.default = router;

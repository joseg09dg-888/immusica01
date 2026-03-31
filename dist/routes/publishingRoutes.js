"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const publishingController_1 = require("../controllers/publishingController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/composers', publishingController_1.createComposer);
router.get('/composers', publishingController_1.getComposers);
router.post('/compositions', publishingController_1.createComposition);
router.post('/compositions/:compositionId/splits', publishingController_1.assignCompositionSplits);
router.post('/compositions/:compositionId/register-pro', publishingController_1.registerWithPRO);
router.post('/royalties', publishingController_1.addPublishingRoyalty);
router.get('/summary', publishingController_1.getPublishingSummary);
exports.default = router;

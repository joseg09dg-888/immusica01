"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const moodController_1 = require("../controllers/moodController");
const router = (0, express_1.Router)();
router.get('/recommendations', moodController_1.getRecommendations);
exports.default = router;

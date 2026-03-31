"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEligibilityByArtist = exports.createOrUpdateEligibility = void 0;
const database_1 = __importDefault(require("../config/database"));
const createOrUpdateEligibility = (artistId, data) => {
    const existing = database_1.default.prepare('SELECT id FROM financing_eligibility WHERE artist_id = ?').get(artistId);
    if (existing) {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        const stmt = database_1.default.prepare(`UPDATE financing_eligibility SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ?`);
        return stmt.run(...values, artistId);
    }
    else {
        const keys = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const stmt = database_1.default.prepare(`INSERT INTO financing_eligibility (artist_id, ${keys}) VALUES (?, ${placeholders})`);
        return stmt.run(artistId, ...values);
    }
};
exports.createOrUpdateEligibility = createOrUpdateEligibility;
const getEligibilityByArtist = (artistId) => {
    return database_1.default.prepare('SELECT * FROM financing_eligibility WHERE artist_id = ?').get(artistId);
};
exports.getEligibilityByArtist = getEligibilityByArtist;

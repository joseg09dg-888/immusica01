"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrandingByArtist = exports.createOrUpdateBranding = void 0;
const database_1 = __importDefault(require("../config/database"));
const createOrUpdateBranding = (artistId, data) => {
    const existing = database_1.default.prepare('SELECT id FROM artist_branding WHERE artist_id = ?').get(artistId);
    if (existing) {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        const stmt = database_1.default.prepare(`UPDATE artist_branding SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE artist_id = ?`);
        return stmt.run(...values, artistId);
    }
    else {
        const keys = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const stmt = database_1.default.prepare(`INSERT INTO artist_branding (artist_id, ${keys}) VALUES (?, ${placeholders})`);
        return stmt.run(artistId, ...values);
    }
};
exports.createOrUpdateBranding = createOrUpdateBranding;
const getBrandingByArtist = (artistId) => {
    return database_1.default.prepare('SELECT * FROM artist_branding WHERE artist_id = ?').get(artistId);
};
exports.getBrandingByArtist = getBrandingByArtist;

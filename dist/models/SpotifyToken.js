"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSpotifyToken = exports.getSpotifyTokenByArtist = exports.saveSpotifyToken = void 0;
const database_1 = __importDefault(require("../config/database"));
const saveSpotifyToken = (data) => {
    // Verificar si ya existe un token para este artista
    const existing = database_1.default.prepare('SELECT id FROM spotify_tokens WHERE artist_id = ?').get(data.artist_id);
    if (existing) {
        // Actualizar
        const stmt = database_1.default.prepare(`
      UPDATE spotify_tokens
      SET access_token = ?, refresh_token = ?, expires_at = ?
      WHERE artist_id = ?
    `);
        return stmt.run(data.access_token, data.refresh_token, data.expires_at, data.artist_id);
    }
    else {
        // Insertar nuevo
        const stmt = database_1.default.prepare(`
      INSERT INTO spotify_tokens (artist_id, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
        return stmt.run(data.artist_id, data.access_token, data.refresh_token, data.expires_at);
    }
};
exports.saveSpotifyToken = saveSpotifyToken;
const getSpotifyTokenByArtist = (artistId) => {
    return database_1.default.prepare('SELECT * FROM spotify_tokens WHERE artist_id = ?').get(artistId);
};
exports.getSpotifyTokenByArtist = getSpotifyTokenByArtist;
const deleteSpotifyToken = (artistId) => {
    return database_1.default.prepare('DELETE FROM spotify_tokens WHERE artist_id = ?').run(artistId);
};
exports.deleteSpotifyToken = deleteSpotifyToken;

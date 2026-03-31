"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtistsByUser = exports.deleteArtist = exports.updateArtist = exports.getArtistById = exports.createArtist = void 0;
const database_1 = __importDefault(require("../database"));
// Crear un artista
const createArtist = (artistData) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO artists (user_id, name, genre, bio, tier, avatar, spotify_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(artistData.user_id, artistData.name, artistData.genre || null, artistData.bio || null, artistData.tier || 'Basic', artistData.avatar || null, artistData.spotify_verified || 0);
    return result.lastInsertRowid;
};
exports.createArtist = createArtist;
// Obtener artista por ID
const getArtistById = (id) => {
    return database_1.default.prepare('SELECT * FROM artists WHERE id = ?').get(id);
};
exports.getArtistById = getArtistById;
// Actualizar artista
const updateArtist = (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    database_1.default.prepare(`UPDATE artists SET ${fields} WHERE id = ?`).run(...values);
};
exports.updateArtist = updateArtist;
// Eliminar artista
const deleteArtist = (id) => {
    database_1.default.prepare('DELETE FROM artists WHERE id = ?').run(id);
};
exports.deleteArtist = deleteArtist;
// Obtener artistas por usuario
const getArtistsByUser = (userId) => {
    return database_1.default.prepare('SELECT * FROM artists WHERE user_id = ?').all(userId);
};
exports.getArtistsByUser = getArtistsByUser;

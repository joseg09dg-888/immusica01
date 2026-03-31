"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserArtistRole = exports.removeUserFromArtist = exports.getUsersByArtist = exports.getArtistsByUser = exports.assignUserToArtist = void 0;
const database_1 = __importDefault(require("../database"));
// Asignar un usuario a un artista (con rol)
const assignUserToArtist = (userId, artistId, role = 'manager') => {
    const stmt = database_1.default.prepare(`
    INSERT OR IGNORE INTO user_artists (user_id, artist_id, role)
    VALUES (?, ?, ?)
  `);
    const result = stmt.run(userId, artistId, role);
    return result.lastInsertRowid;
};
exports.assignUserToArtist = assignUserToArtist;
// Obtener artistas de un usuario
const getArtistsByUser = (userId) => {
    const stmt = database_1.default.prepare(`
    SELECT ua.*, a.name as artist_name, a.genre, a.tier
    FROM user_artists ua
    JOIN artists a ON ua.artist_id = a.id
    WHERE ua.user_id = ?
  `);
    return stmt.all(userId);
};
exports.getArtistsByUser = getArtistsByUser;
// Obtener usuarios (con roles) de un artista
const getUsersByArtist = (artistId) => {
    const stmt = database_1.default.prepare(`
    SELECT ua.*, u.email, u.name as user_name
    FROM user_artists ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.artist_id = ?
  `);
    return stmt.all(artistId);
};
exports.getUsersByArtist = getUsersByArtist;
// Eliminar relación
const removeUserFromArtist = (userId, artistId) => {
    database_1.default.prepare('DELETE FROM user_artists WHERE user_id = ? AND artist_id = ?').run(userId, artistId);
};
exports.removeUserFromArtist = removeUserFromArtist;
// Verificar si un usuario tiene acceso a un artista (y con qué rol)
const getUserArtistRole = (userId, artistId) => {
    const result = database_1.default.prepare('SELECT role FROM user_artists WHERE user_id = ? AND artist_id = ?').get(userId, artistId);
    return result?.role || null;
};
exports.getUserArtistRole = getUserArtistRole;

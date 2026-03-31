"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTrack = exports.updateTrack = exports.getTracksByArtist = exports.getTrackById = exports.createTrack = void 0;
const database_1 = __importDefault(require("../database"));
// Crear un nuevo track
const createTrack = (trackData) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO tracks (
      artist_id, title, release_date, scheduled_date, cover, audio_url, status, isrc, upc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(trackData.artist_id, trackData.title, trackData.release_date || null, trackData.scheduled_date || null, trackData.cover || null, trackData.audio_url || null, trackData.status || 'draft', trackData.isrc || null, trackData.upc || null);
    return result.lastInsertRowid;
};
exports.createTrack = createTrack;
// Obtener un track por ID
const getTrackById = (id) => {
    return database_1.default.prepare('SELECT * FROM tracks WHERE id = ?').get(id);
};
exports.getTrackById = getTrackById;
// Obtener todos los tracks de un artista
const getTracksByArtist = (artistId) => {
    return database_1.default.prepare('SELECT * FROM tracks WHERE artist_id = ? ORDER BY created_at DESC').all(artistId);
};
exports.getTracksByArtist = getTracksByArtist;
// Actualizar un track
const updateTrack = (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    database_1.default.prepare(`UPDATE tracks SET ${fields} WHERE id = ?`).run(...values);
};
exports.updateTrack = updateTrack;
// Eliminar un track
const deleteTrack = (id) => {
    database_1.default.prepare('DELETE FROM tracks WHERE id = ?').run(id);
};
exports.deleteTrack = deleteTrack;

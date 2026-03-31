"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRatingsByUser = exports.getAverageRatingByBeat = exports.getRatingsByBeat = exports.createRating = void 0;
const database_1 = __importDefault(require("../config/database"));
const createRating = (data) => {
    // Evitar duplicados (un usuario no puede valorar dos veces el mismo beat)
    const existing = database_1.default.prepare('SELECT id FROM ratings WHERE beat_id = ? AND usuario_id = ?').get(data.beat_id, data.usuario_id);
    if (existing) {
        // Actualizar en lugar de insertar
        const stmt = database_1.default.prepare('UPDATE ratings SET puntuacion = ?, comentario = ? WHERE beat_id = ? AND usuario_id = ?');
        return stmt.run(data.puntuacion, data.comentario, data.beat_id, data.usuario_id);
    }
    else {
        const stmt = database_1.default.prepare('INSERT INTO ratings (beat_id, usuario_id, puntuacion, comentario) VALUES (?, ?, ?, ?)');
        return stmt.run(data.beat_id, data.usuario_id, data.puntuacion, data.comentario);
    }
};
exports.createRating = createRating;
const getRatingsByBeat = (beatId) => {
    return database_1.default.prepare('SELECT * FROM ratings WHERE beat_id = ? ORDER BY created_at DESC').all(beatId);
};
exports.getRatingsByBeat = getRatingsByBeat;
const getAverageRatingByBeat = (beatId) => {
    const result = database_1.default.prepare('SELECT AVG(puntuacion) as promedio FROM ratings WHERE beat_id = ?').get(beatId);
    return result.promedio || 0;
};
exports.getAverageRatingByBeat = getAverageRatingByBeat;
const getRatingsByUser = (usuarioId) => {
    return database_1.default.prepare('SELECT * FROM ratings WHERE usuario_id = ? ORDER BY created_at DESC').all(usuarioId);
};
exports.getRatingsByUser = getRatingsByUser;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBeat = exports.updateBeat = exports.getBeatsByProducer = exports.getAllBeats = exports.getBeatById = exports.createBeat = void 0;
const database_1 = __importDefault(require("../config/database"));
const createBeat = (data) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO beats (productor_id, titulo, genero, bpm, tonalidad, precio, archivo_url, archivo_completo_url, portada_url, descripcion, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(data.productor_id, data.titulo, data.genero, data.bpm, data.tonalidad, data.precio, data.archivo_url, data.archivo_completo_url, data.portada_url, data.descripcion, data.estado || 'disponible');
};
exports.createBeat = createBeat;
const getBeatById = (id) => {
    return database_1.default.prepare('SELECT * FROM beats WHERE id = ?').get(id);
};
exports.getBeatById = getBeatById;
const getAllBeats = (filtros) => {
    let query = 'SELECT * FROM beats WHERE estado = "disponible"';
    const params = [];
    if (filtros?.genero) {
        query += ' AND genero = ?';
        params.push(filtros.genero);
    }
    if (filtros?.orden === 'mas_comprados') {
        // Necesitamos JOIN con compras para contar
        // Por ahora, lo dejamos simple
        query += ' ORDER BY id DESC';
    }
    else if (filtros?.orden === 'mejor_puntuados') {
        // Necesitamos JOIN con valoraciones
        query += ' ORDER BY id DESC';
    }
    else {
        query += ' ORDER BY created_at DESC';
    }
    return database_1.default.prepare(query).all(...params);
};
exports.getAllBeats = getAllBeats;
const getBeatsByProducer = (productorId) => {
    return database_1.default.prepare('SELECT * FROM beats WHERE productor_id = ? ORDER BY created_at DESC').all(productorId);
};
exports.getBeatsByProducer = getBeatsByProducer;
const updateBeat = (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const stmt = database_1.default.prepare(`UPDATE beats SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    return stmt.run(...values, id);
};
exports.updateBeat = updateBeat;
const deleteBeat = (id) => {
    return database_1.default.prepare('DELETE FROM beats WHERE id = ?').run(id);
};
exports.deleteBeat = deleteBeat;

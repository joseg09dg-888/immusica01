"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = exports.getAllRoyalties = exports.getRoyaltiesByArtist = exports.createRoyalty = void 0;
const database_1 = __importDefault(require("../config/database"));
const createRoyalty = (data) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO royalties (fecha, plataforma, tipo, cantidad, track_id, concepto, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(data.fecha, data.plataforma, data.tipo, data.cantidad, data.track_id, data.concepto, data.estado);
};
exports.createRoyalty = createRoyalty;
const getRoyaltiesByArtist = (artistId) => {
    return database_1.default.prepare(`
    SELECT r.* FROM royalties r
    LEFT JOIN tracks t ON r.track_id = t.id
    WHERE t.artist_id = ? OR r.track_id IS NULL
    ORDER BY r.fecha DESC
  `).all(artistId);
};
exports.getRoyaltiesByArtist = getRoyaltiesByArtist;
const getAllRoyalties = () => {
    return database_1.default.prepare('SELECT * FROM royalties ORDER BY fecha DESC').all();
};
exports.getAllRoyalties = getAllRoyalties;
const getSummary = (artistId) => {
    let query = `
    SELECT 
      SUM(cantidad) as total,
      plataforma,
      strftime('%Y-%m', fecha) as mes
    FROM royalties r
    LEFT JOIN tracks t ON r.track_id = t.id
    WHERE 1=1
  `;
    const params = [];
    if (artistId) {
        query += ' AND (t.artist_id = ? OR r.track_id IS NULL)';
        params.push(artistId);
    }
    query += ' GROUP BY plataforma, mes ORDER BY mes DESC';
    const rows = database_1.default.prepare(query).all(...params);
    // Calcular totales
    const total = rows.reduce((acc, r) => acc + r.total, 0);
    const byPlatform = rows.reduce((acc, r) => {
        if (!acc[r.plataforma])
            acc[r.plataforma] = 0;
        acc[r.plataforma] += r.total;
        return acc;
    }, {});
    const byMonth = rows.reduce((acc, r) => {
        if (!acc[r.mes])
            acc[r.mes] = 0;
        acc[r.mes] += r.total;
        return acc;
    }, {});
    return { total, byPlatform, byMonth };
};
exports.getSummary = getSummary;

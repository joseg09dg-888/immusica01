"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalComprasPorComprador = exports.getTotalComprasPorProductor = exports.getPurchasesByBuyer = exports.getPurchasesByBeat = exports.createPurchase = void 0;
const database_1 = __importDefault(require("../config/database"));
const createPurchase = (data) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO purchases (beat_id, comprador_id, monto, comision_plataforma, fecha)
    VALUES (?, ?, ?, ?, ?)
  `);
    return stmt.run(data.beat_id, data.comprador_id, data.monto, data.comision_plataforma, data.fecha);
};
exports.createPurchase = createPurchase;
const getPurchasesByBeat = (beatId) => {
    return database_1.default.prepare('SELECT * FROM purchases WHERE beat_id = ? ORDER BY fecha DESC').all(beatId);
};
exports.getPurchasesByBeat = getPurchasesByBeat;
const getPurchasesByBuyer = (compradorId) => {
    return database_1.default.prepare('SELECT * FROM purchases WHERE comprador_id = ? ORDER BY fecha DESC').all(compradorId);
};
exports.getPurchasesByBuyer = getPurchasesByBuyer;
const getTotalComprasPorProductor = (productorId) => {
    const result = database_1.default.prepare(`
    SELECT COUNT(*) as total FROM purchases p
    JOIN beats b ON p.beat_id = b.id
    WHERE b.productor_id = ?
  `).get(productorId);
    return result.total;
};
exports.getTotalComprasPorProductor = getTotalComprasPorProductor;
const getTotalComprasPorComprador = (compradorId) => {
    const result = database_1.default.prepare('SELECT COUNT(*) as total FROM purchases WHERE comprador_id = ?').get(compradorId);
    return result.total;
};
exports.getTotalComprasPorComprador = getTotalComprasPorComprador;
